import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard metadata', () => {
  it('ưu tiên quyền trên handler thay vì quyền mặc định của controller', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['STUDENT']),
    } as any;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'STUDENT' } }) }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
