import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { CommonException } from '../exception/common-exception';

@Catch(CommonException)
export class CommonExceptionFilter implements ExceptionFilter {
  catch(exception: CommonException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    // TODO) winston과 결합해서 쓰는 방법도 고민해보기

    response.status(status).json({
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
