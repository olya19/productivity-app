import { Tasks } from '../../components/tasks/tasks';
import { GlobalTask } from '../../components/global-task/global-task';
import { workGroup, educationGroup, hobbyGroup, sportGroup, otherGroup } from './data';

const globalTaskListTemplate = require('./global-task-list.hbs');

export class GlobalTaskList {
  constructor(element) {
    this.element = element;
    this.task = new Tasks();
    this.globalTask = new GlobalTask();
  }

  render(removeMode) {
    workGroup.forEach((elem) => {
      elem.remove = removeMode;
    });
    educationGroup.forEach((elem) => {
      elem.remove = removeMode;
    });
    hobbyGroup.forEach((elem) => {
      elem.remove = removeMode;
    });
    sportGroup.forEach((elem) => {
      elem.remove = removeMode;
    });
    otherGroup.forEach((elem) => {
      elem.remove = removeMode;
    });

    const globalTask = {
      workGroup: this.task.getTasksHTML(workGroup),
      educationGroup: this.task.getTasksHTML(educationGroup),
      hobbyGroup: this.task.getTasksHTML(hobbyGroup),
      sportGroup: this.task.getTasksHTML(sportGroup),
      otherGroup: this.task.getTasksHTML(otherGroup)
    };

    this.element.insertAdjacentHTML('beforeEnd', globalTaskListTemplate(globalTask));
  }

  renderRemoveMode() {
    const globalTask = {
      workGroup: this.globalTask.getTasksHTML(workGroup),
      educationGroup: this.globalTask.getTasksHTML(educationGroup),
      hobbyGroup: this.globalTask.getTasksHTML(hobbyGroup),
      sportGroup: this.globalTask.getTasksHTML(sportGroup),
      otherGroup: this.globalTask.getTasksHTML(otherGroup),
    };

    this.element.insertAdjacentHTML('beforeEnd', globalTaskListTemplate(globalTask));
  }

  remove() {
    const globalTaskList = document.getElementsByClassName('global-tasks')[0];
    const parentGlobalTaskList = globalTaskList.parentNode;
    parentGlobalTaskList.removeChild(globalTaskList);
  }
}