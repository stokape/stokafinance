import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonths, formatISO } from "date-fns";
import type { Database } from "@/types/database.types";
import { CreditCardsRepository } from "../repositories/credit-cards.repository";
import { TransactionIntakeService } from "@/features/transactions/services/transaction-intake.service";
import { divideMoney, roundMoney, subtractMoney } from "@/lib/utils/money";
import type { CreateCardPurchaseInput, CreateCreditCardInput, PayCreditCardInput } from "../validations/credit-card.schema";
import type { CreditCard, CreditCardTransaction, CreditCardWithBalance } from "../types/credit-card.types";

export class CreditCardsService {
  private readonly repository: CreditCardsRepository;
  private readonly intake: TransactionIntakeService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new CreditCardsRepository(supabase);
    this.intake = new TransactionIntakeService(supabase);
  }

  listCards(options?: { includeInactive?: boolean }): Promise<CreditCardWithBalance[]> {
    return this.repository.list(options);
  }

  getCard(id: string): Promise<CreditCardWithBalance | null> {
    return this.repository.findById(id);
  }

  listPurchases(creditCardId: string): Promise<CreditCardTransaction[]> {
    return this.repository.listPurchases(creditCardId);
  }

  async createCard(userId: string, input: CreateCreditCardInput): Promise<CreditCard> {
    return this.repository.create(userId, {
      name: input.name,
      bank: input.bank,
      brand: input.brand || null,
      last_four_digits: input.lastFourDigits || null,
      currency: input.currency,
      credit_limit: input.creditLimit,
      closing_day: input.closingDay,
      payment_day: input.paymentDay,
      annual_interest_rate: input.annualInterestRate || null,
    });
  }

  archiveCard(id: string): Promise<void> {
    return this.repository.archive(id);
  }

  /**
   * Registra una compra con tarjeta (§13/§14/§58): sube la deuda de la
   * tarjeta vía CARD_PURCHASE en la fecha de compra, sin tocar ninguna
   * cuenta bancaria. Si hay cuotas > 1, genera además el calendario de
   * cuotas proyectado (credit_card_installment_plans) para referencia —
   * el ledger ya refleja el monto total desde el día de la compra, como
   * ocurre realmente con una línea de crédito.
   */
  async recordPurchase(userId: string, input: CreateCardPurchaseInput): Promise<string> {
    const card = await this.repository.findById(input.creditCardId);
    if (!card) throw new Error("CREDIT_CARD_NOT_FOUND");

    const purchaseRow = await this.repository.createPurchase({
      user_id: userId,
      credit_card_id: input.creditCardId,
      category_id: input.categoryId,
      description: input.description,
      merchant: input.merchant || null,
      amount: input.amount,
      purchase_date: input.purchaseDate,
      installments: input.installments,
      notes: input.notes || null,
    });

    if (input.installments > 1) {
      const installmentAmount = roundMoney(divideMoney(input.amount, input.installments));
      const plans = Array.from({ length: input.installments }, (_, index) => {
        const statementPeriod = formatISO(addMonths(new Date(input.purchaseDate), index), { representation: "date" }).slice(0, 7) + "-01";
        return {
          user_id: userId,
          credit_card_transaction_id: purchaseRow.id,
          installment_number: index + 1,
          amount: installmentAmount.toString(),
          statement_period: statementPeriod,
        };
      });
      await this.repository.createInstallmentPlans(plans);
    }

    const result = await this.intake.intake({
      userId,
      source: "CREDIT_CARD",
      transactionType: "CARD_PURCHASE",
      amount: input.amount,
      currency: card.currency,
      accountId: null,
      creditCardId: input.creditCardId,
      categoryId: input.categoryId,
      description: input.description,
      merchant: input.merchant || null,
      transactionDate: input.purchaseDate,
      notes: input.notes || null,
    });

    return result.transactionId;
  }

  /**
   * Registra el pago de una tarjeta (§58): baja la deuda y saca dinero de la
   * cuenta elegida. NUNCA genera un gasto nuevo — es un traspaso de pasivo,
   * ya reconocido como gasto en el momento de cada compra.
   */
  async payCard(userId: string, input: PayCreditCardInput): Promise<string> {
    const card = await this.repository.findById(input.creditCardId);
    if (!card) throw new Error("CREDIT_CARD_NOT_FOUND");

    const result = await this.intake.intake({
      userId,
      source: "WEB",
      transactionType: "CARD_PAYMENT",
      amount: input.amount,
      currency: card.currency,
      accountId: input.accountId,
      creditCardId: input.creditCardId,
      description: `Pago ${card.name}`,
      transactionDate: input.paymentDate,
      notes: input.notes || null,
    });

    return result.transactionId;
  }

  /** Saldo restante tras un pago parcial — útil para prellenar "pago total" en el formulario. */
  static remainingAfterPayment(currentDebt: string, paymentAmount: string) {
    return subtractMoney(currentDebt, paymentAmount);
  }
}
