import { Observer } from '../../observer';
import { Tasks } from '../../components/tasks/tasks';
import { eventBus } from '../../event-bus';
import { getShortMonthName } from '../../helpers/date-formatting';
import { notification } from '../../components/notification-message/notification-message';
import globalTaskListTemplate from './global-task-list.hbs';
import { router } from '../../router';

require('../../tooltip.js');

export class GlobalTaskListView {
  constructor(element) {
    this.element = element;
    this.task = new Tasks();
    this.renderEvent = new Observer(this);
    this.isGlobalListOpened = false;
    this.taskHandlers = {
      checkToRemove: this.checkToRemove,
      edit: this.edit,
      moveToToDo: this.moveToToDo,
      goToTimer: this.goToTimer
    };

    eventBus.registerEventHandler('render', this.render.bind(this));
    eventBus.registerEventHandler('hideEmptyGroup', this.hideEmptyGroup.bind(this));
    eventBus.registerEventHandler('renderNewTask', this.renderNewTask.bind(this));
    eventBus.registerEventHandler('addListenerForNewTask', this.addListenerForNewTask.bind(this));
    eventBus.registerEventHandler('closeGlobalList', this.closeGlobalList.bind(this));
  }

  render(removeMode, data) {
    const globalTask = {
      workGroup: this.task.getTasksHTML({ removeMode: removeMode, tasksList: data.workGroup }),
      educationGroup: this.task.getTasksHTML({ removeMode: removeMode, tasksList: data.educationGroup }),
      hobbyGroup: this.task.getTasksHTML({ removeMode: removeMode, tasksList: data.hobbyGroup }),
      sportGroup: this.task.getTasksHTML({ removeMode: removeMode, tasksList: data.sportGroup }),
      otherGroup: this.task.getTasksHTML({ removeMode: removeMode, tasksList: data.otherGroup })
    };

    this.element.insertAdjacentHTML('beforeEnd', globalTaskListTemplate(globalTask));

    if (!this.isGlobalListOpened) {
      document.getElementsByClassName('global-tasks')[0].classList.add('display-none');
    } 

    $('.global-list-link').tooltip();
    $('.edit-task').tooltip();
    $('.icon-tomato').tooltip();
    if (removeMode) {
      eventBus.dispatch('showRemoveTasksMode');
    }
    this.addListeners(removeMode);
  }

  addListeners() {
    const globalTaskLink = document.getElementsByClassName('global-list-link')[0];
    const arrowSpan = document.getElementById('arrow');
    globalTaskLink.addEventListener('click', (event) => {
      event.preventDefault();
      if (this.isGlobalListOpened) {
        arrowSpan.className = 'icon-global-list-arrow-right';
        this.isGlobalListOpened = false;
        document.getElementsByClassName('global-tasks')[0].classList.add('display-none');
        document.getElementById('priorityFilter').classList.add('display-none');
        document.getElementById('selectGlobalList').classList.add('display-none');
      } else {
        this.isGlobalListOpened = true;
        arrowSpan.className = 'icon-global-list-arrow-down';
        document.getElementsByClassName('global-tasks')[0].classList.remove('display-none');
        document.getElementById('priorityFilter').classList.remove('display-none');
        if (document.getElementsByClassName('checkbox-move-to-trash').length) {
          document.getElementById('selectGlobalList').classList.remove('display-none');
        }
      }
    });

    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');

    selectAllBtn.addEventListener('click', (event) => {
      event.preventDefault();
      this.selectDeselectCheckboxes(true);
    });

    deselectAllBtn.addEventListener('click', (event) => {
      event.preventDefault();
      this.selectDeselectCheckboxes(false);
    });

    this.addListenersForTasks();
    this.addListenersForFilter();

  }

  selectDeselectCheckboxes(state) {
    const allTasks = this.getAllTasks();
    const checkboxes = allTasks.map(task => task.getElementsByClassName('checkbox-move-to-trash')[0]);

    checkboxes.forEach((checkbox, index) => {
      if (state && !checkbox.checked) {
        checkbox.checked = state;
        eventBus.dispatch('incrementRemoveTaskQuantity');
        eventBus.dispatch('saveCheckedTasks', allTasks[index].dataset.id);
      }

      if (!state && checkbox.checked) {
        checkbox.checked = state;
        eventBus.dispatch('decrementRemoveTaskQuantity');
        eventBus.dispatch('removeCheckedTask', allTasks[index].dataset.id);
      }
    });    
  }

  addListenersForFilter() {
    const filter = document.getElementById('priorityFilter');

    filter.addEventListener('click', (event) => {
      event.preventDefault();

      const allTasks = this.getAllTasks();

      if (event.target.id === 'allFilter') {
        allTasks.forEach(task => task.classList.remove('display-none'));
        Array.from(filter.getElementsByTagName('a')).forEach(a => a.classList.remove('active'));
        event.target.classList.add('active');
        this.showGroup();
        this.hideEmptyGroup();
      } else if (event.target.tagName === 'A') {
        allTasks.forEach(task => task.classList.remove('display-none'));
        allTasks.filter(task => !task.classList.contains(event.target.dataset.priority)).forEach(task => task.classList.add('display-none'));
        Array.from(filter.getElementsByTagName('a')).forEach(a => a.classList.remove('active'));
        event.target.classList.add('active');
        this.showGroup();
        this.hideEmptyGroup();
      }
    });
  }

  addListenersForTasks() {
    const tasksLi = Array.from(document.getElementsByClassName('task'));
    tasksLi.forEach((task) => {
      task.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        if (action in this.taskHandlers) {
          this.taskHandlers[action].call(this, e.currentTarget.dataset.id, e.target);
        }
      });
    });
  }

  showGroup() {
    document.getElementsByClassName('work-group')[0].classList.remove('display-none');
    document.getElementsByClassName('education-group')[0].classList.remove('display-none');
    document.getElementsByClassName('sport-group')[0].classList.remove('display-none');
    document.getElementsByClassName('hobby-group')[0].classList.remove('display-none');
    document.getElementsByClassName('other-group')[0].classList.remove('display-none');
  }

  addListenerForNewTask(id) {
    const taskLi = Array.from(document.getElementsByClassName('task')).find((li) => li.dataset.id === id);
    taskLi.addEventListener('click', (e) => {
      e.preventDefault();
      const action = e.target.dataset.action;
      if (action in this.taskHandlers) {
        this.taskHandlers[action].call(this, e.currentTarget.dataset.id, e.target);
      }
    });
  }

  hideEmptyGroup() {
    if (document.getElementsByClassName('global-tasks').length) {
      const workGroupTasks = Array.from(document.querySelectorAll('.work-group ul li'));
      const hobbyGroupTasks = Array.from(document.querySelectorAll('.hobby-group ul li'));
      const educationGroupTasks = Array.from(document.querySelectorAll('.education-group ul li'));
      const sportGroupTasks = Array.from(document.querySelectorAll('.sport-group ul li'));
      const otherGroupTasks = Array.from(document.querySelectorAll('.other-group ul li'));

      if(workGroupTasks.length === 0 ||
        workGroupTasks.every( task => task.classList.contains('display-none'))) {
        document.getElementsByClassName('work-group')[0].classList.add('display-none');
      }
      if(hobbyGroupTasks.length === 0 ||
        hobbyGroupTasks.every( task => task.classList.contains('display-none'))) {
        document.getElementsByClassName('hobby-group')[0].classList.add('display-none');
      }
      if(educationGroupTasks.length === 0 ||
        educationGroupTasks.every( task => task.classList.contains('display-none'))) {
        document.getElementsByClassName('education-group')[0].classList.add('display-none');
      }
      if(sportGroupTasks.length === 0 ||
        sportGroupTasks.every( task => task.classList.contains('display-none'))) {

        document.getElementsByClassName('sport-group')[0].classList.add('display-none');
      }
      if(otherGroupTasks.length === 0 ||
        otherGroupTasks.every( task => task.classList.contains('display-none'))) {
        document.getElementsByClassName('other-group')[0].classList.add('display-none');
      }
    }
  }

  checkToRemove(id, label) {
    const currentCheckbox = label.previousElementSibling;
    currentCheckbox.checked = !currentCheckbox.checked;
    if (currentCheckbox.checked) {
      eventBus.dispatch('incrementRemoveTaskQuantity');
      eventBus.dispatch('saveCheckedTasks', id);
    } else {
      eventBus.dispatch('decrementRemoveTaskQuantity');
      eventBus.dispatch('removeCheckedTask', id);
    }
  }

  renderNewTask(task) {
    if (document.getElementsByClassName('global-list-link').length) {
      task.deadline.month = getShortMonthName(task.deadline.month);

      const taskGroup = document.querySelector(`.${task.category}-group ul`);
      const taskHTML = this.task.getTasksHTML({tasksList: [task]});
      taskGroup.insertAdjacentHTML('afterbegin', taskHTML);
      this.addListenerForNewTask(task.id);
  
      $('.edit-task').tooltip();
      $('.icon-tomato').tooltip();
  
      document.getElementsByClassName('global-list-link')[0].classList.remove('display-none');
      this.showGroup();
      this.hideEmptyGroup();

      if (document.getElementById('goToRemove').classList.contains('active')) {
        eventBus.dispatch('showRemoveTasksMode');
      }
    } else {
      eventBus.dispatch('renderToDo');
    }
  }

  edit(id) {
    eventBus.dispatch('renderModalEdit', id);
  }

  moveToToDo(id) {
    const dailyTasksSection = document.getElementsByClassName('daily-tasks')[0];
    const dailyTasks = dailyTasksSection.getElementsByClassName('task');

    if (dailyTasks.length > 4) {
      notification.showMessage({type: 'warning', message: 'You can drag to daily tasks list only 5 tasks'});
    } else {
      eventBus.dispatch('renderOneTask', id);
      eventBus.dispatch('changeTaskStateToActive', id);
      this.hideEmptyGroup();
    }
  }

  goToTimer(id, target) {
    if (target.closest('section').classList.contains('global-tasks')) {
      notification.showMessage({type: 'warning', message: 'Move to daily list'});

    } else {
      this.closeGlobalList();
      sessionStorage.setItem('taskInProgress', id);
      router.navigate('#timer');
      eventBus.dispatch('setToDoRenderedState', false);
    }
  }

  closeGlobalList() {
    this.isGlobalListOpened = false;
  }

  getAllTasks() {
    const globalTasksSection = document.getElementsByClassName('global-tasks')[0];
    
    return Array.from(globalTasksSection.getElementsByClassName('task'));
  }
}
