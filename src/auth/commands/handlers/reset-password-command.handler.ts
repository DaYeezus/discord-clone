import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResetPasswordCommand } from '../impl/reset-password.command';
import { PrismaService } from '../../../prisma.service';
import { compare } from 'bcrypt';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordCommandHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  constructor(private readonly prismaService: PrismaService) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const { email, password } = command;
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { email },
      select: {
        password: true,
      },
    });
    if (await compare(password, user.password)) {
      throw new BadRequestException(
        'New password must be different from previous one',
      );
    }
    await this.prismaService.user.update({
      where: { email },
      data: {
        password,
        resetPasswordAttempt: { increment: 1 },
        lastResetPasswordAttempt: new Date(),
      },
    });
  }
}
