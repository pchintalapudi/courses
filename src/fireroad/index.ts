import { CourseRequester, CourseJSON, FullCourseJSON, is_full_course } from './courses';
import { RequirementsRequester, RequirementsJSON, RequirementTitles } from './requirements';

const server_courses = new CourseRequester();
const server_requirements = new RequirementsRequester();

export { server_courses, server_requirements };
export { CourseJSON, FullCourseJSON, RequirementsJSON, RequirementTitles };
export { is_full_course };
