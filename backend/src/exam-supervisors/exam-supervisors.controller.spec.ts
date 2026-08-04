import { PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { ExamSupervisorsController } from './exam-supervisors.controller';

describe('ExamSupervisorsController contract', () => {
  it('chỉ cho phép ADMIN quản lý giám thị', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ExamSupervisorsController)).toEqual(['ADMIN']);
  });

  it('công bố route assign chuẩn', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ExamSupervisorsController.prototype.assign)).toBe('assign');
  });
});
