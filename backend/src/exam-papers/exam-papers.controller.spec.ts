import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { ExamPapersController } from './exam-papers.controller';

describe('ExamPapersController roles', () => {
  it('chặn STUDENT khỏi toàn bộ module', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ExamPapersController)).toEqual(['ADMIN', 'TEACHER']);
  });

  it('chỉ ADMIN được phát hành đề', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      ExamPapersController.prototype.publish,
    );
    expect(roles).toEqual(['ADMIN']);
  });
});
