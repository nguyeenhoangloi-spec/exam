import { PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { ExamArrangementController } from './exam-arrangement.controller';

describe('ExamArrangementController contract', () => {
  it('chỉ cho phép ADMIN xếp phòng', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ExamArrangementController)).toEqual(['ADMIN']);
  });

  it('công bố route auto-arrange chuẩn', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ExamArrangementController.prototype.autoArrange)).toBe('auto-arrange');
  });
});
