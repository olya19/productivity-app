import taskTemplate from './global-task.hbs';

export class GlobalTask {
  constructor() { }

  getTasksHTML(tasks) {
    return taskTemplate(tasks);
  }

  addListeners() {

  }
}