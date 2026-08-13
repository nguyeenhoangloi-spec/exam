import 'reflect-metadata';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { AiController } from './ai.controller';

describe('AiController access policy', () => {
  it('restricts the controller and every AI operation to administrators and teachers', () => {
    const expectedRoles = ['ADMIN', 'TEACHER'];
    expect(Reflect.getMetadata(ROLES_KEY, AiController)).toEqual(expectedRoles);
    expect(Reflect.getMetadata(ROLES_KEY, AiController.prototype.getStatus)).toEqual(expectedRoles);
    expect(Reflect.getMetadata(ROLES_KEY, AiController.prototype.gradeEssay)).toEqual(expectedRoles);
    expect(Reflect.getMetadata(ROLES_KEY, AiController.prototype.generateQuestions)).toEqual(expectedRoles);
  });
});
