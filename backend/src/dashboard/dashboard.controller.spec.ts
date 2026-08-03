import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { DashboardController } from './dashboard.controller';

describe('DashboardController authorization', () => {
  it('chỉ cho phép ADMIN truy cập controller', () => {
    expect(Reflect.getMetadata(ROLES_KEY, DashboardController)).toEqual(['ADMIN']);
  });
});
