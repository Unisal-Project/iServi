import { PrismaPaymentRepository } from "./repositories/prisma-payment.repository.js";
import type { CloseAttendanceDTO } from "./dto/close-attendance.dto.js";
import type { PaymentRepository } from "./repositories/payment.repository.js";

type PaymentConfirmedHandler = (attendanceId: bigint) => Promise<void>;

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository = new PrismaPaymentRepository(),
    private readonly onPaymentConfirmed?: PaymentConfirmedHandler,
  ) {}

  async closeAttendance(
    attendanceId: bigint,
    data: CloseAttendanceDTO,
    closedById: bigint,
  ) {
    const result = await this.paymentRepository.closeWithPayments(
      attendanceId,
      data,
      closedById,
    );

    await this.notifyPaymentConfirmed(result.attendanceId);

    return {
      ...result,
      attendanceId: result.attendanceId.toString(),
    };
  }

  async reopenAttendance(attendanceId: bigint) {
    const result = await this.paymentRepository.reopen(attendanceId);

    return {
      ...result,
      attendanceId: result.attendanceId.toString(),
    };
  }

  async confirmAttendancePayment(attendanceId: bigint, userId: bigint) {
    const payment = await this.paymentRepository.confirmFullPayment(
      attendanceId,
      userId,
    );

    await this.notifyPaymentConfirmed(payment.attendanceId);

    return {
      attendanceId: payment.attendanceId.toString(),
      amount: payment.amount,
      status: "PAID" as const,
      paidAt: payment.paidAt,
    };
  }

  private async notifyPaymentConfirmed(attendanceId: bigint): Promise<void> {
    try {
      await this.onPaymentConfirmed?.(attendanceId);
    } catch {
      console.warn(
        `Falha ao notificar pagamento do atendimento ${attendanceId}.`,
      );
    }
  }
}
