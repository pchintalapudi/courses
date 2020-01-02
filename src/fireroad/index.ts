import { CourseRequester, CourseJSON, FullCourseJSON, is_full_course, compute_color } from './courses';
import {
    RequirementsRequester,
    RequirementsJSON,
    RequirementTitles,
    has_progress,
    has_requirements,
    ProgressJSON,
    Requirement,
    RequirementGroup,
    is_requirement
} from './requirements';
import { Trie } from './search';
import { RoadJSON, Class } from './requirements';

const server_courses = new CourseRequester();
const server_requirements = new RequirementsRequester();

export { server_courses, server_requirements };
export {
    CourseJSON,
    FullCourseJSON,
    RequirementsJSON,
    RequirementTitles,
    ProgressJSON,
    Requirement,
    RequirementGroup,
    is_requirement,
    RoadJSON,
    Class,
    compute_color
};
export { is_full_course };
export { Trie };
export { has_progress, has_requirements };
