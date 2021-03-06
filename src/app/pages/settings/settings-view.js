import { Tabs } from '../../components/tabs/tabs';
import { NotificationMessage } from '../../components/notification-message/notification-message';
import { eventBus } from '../../event-bus';
import { router } from '../../router';
import pomodorosSettingsTemplate from './pomodoros-settings.hbs';
import settingsCategoriesTemplate from './settings-categories.hbs';

export class SettingsView {
  constructor(element) {
    this.element = element;
    this.tabs = new Tabs(
      [
        {
          name: 'Settings',
          id: 'pomodorosTab',
          handler: (e) => {
            e.preventDefault();
            this.renderSettings();
          }
        },
        {
          name: 'Categories',
          id: 'categoriesTab',
          handler: (e) => {
            e.preventDefault();
            this.renderCategories();
          }
        }
      ]
    );
  }


  renderSettings() {
    this.element.innerHTML = pomodorosSettingsTemplate({tabs: this.tabs.getTabsHTML()});
    const settings = JSON.parse(sessionStorage.getItem('settings'));
    if (settings) {
      document.getElementById('workTimeValue').innerText = settings.workTime;
      document.getElementById('workIterationValue').innerText = settings.workIteration;
      document.getElementById('shortBreakValue').innerText = settings.shortBreak;
      document.getElementById('longBreakValue').innerText = settings.longBreak;
    }
    eventBus.dispatch('setSettingsActive');
    renderGraph();
    this.addListeners();
  }

  renderCategories() {
    this.element.innerHTML = settingsCategoriesTemplate({tabs: this.tabs.getTabsHTML()});
    this.addListeners();
  }

  addListeners() {
    this.tabs.addListeners();

    const goToTask = document.getElementsByClassName('go-to-task')[0];
    const saveSettingsBtn = document.getElementsByClassName('save-settings')[0];
    const notification = new NotificationMessage();

    goToTask.addEventListener('click', (event) => {
      event.preventDefault();
      eventBus.dispatch('setTasksActive');
      router.navigate('#tasks-list');
    });

    saveSettingsBtn.addEventListener('click', () => {
      const settings = {
        workTime: parseInt(document.getElementById('workTimeValue').innerText),
        workIteration: parseInt(document.getElementById('workIterationValue').innerText),
        shortBreak: parseInt(document.getElementById('shortBreakValue').innerText),
        longBreak: parseInt(document.getElementById('longBreakValue').innerText)
      };

      sessionStorage.setItem('settings', JSON.stringify(settings));
      notification.showMessage({type: 'success', message: 'Settings successfully saved'});
      eventBus.dispatch('setTasksActive');
      router.navigate('#task-list');
    });
  }
}



class Voter {
  constructor(options) {
    this.minValue = options.minValue;
    this.maxValue = options.maxValue;
    this.step = options.step;
    this.element = options.element;
    this.render = options.render;

    this.valueElement = this.element.getElementsByClassName('value')[0];
    this.decreaseButton = this.element.getElementsByClassName('decrease')[0];
    this.increaseButton = this.element.getElementsByClassName('increase')[0];

    this.decreaseButton.addEventListener('click', this.decrease.bind(this));
    this.increaseButton.addEventListener('click', this.increase.bind(this));
  }

  increase() {
    const newValue = parseInt(this.valueElement.innerText) + this.step;
    if (newValue <= this.maxValue) {
      this.valueElement.innerText = newValue;
      this.render('increase');
    }
  }

  decrease() {
    const newValue = parseInt(this.valueElement.innerText) - this.step;
    if (newValue >= this.minValue) {
      this.valueElement.innerText = newValue;
      this.render('decrease');
    }
  }
}

function renderGraph() {

  const workTime = document.getElementById('workTimeValue');
  const workIteration = document.getElementById('workIterationValue');
  const shortBreak = document.getElementById('shortBreakValue');
  const longBreak = document.getElementById('longBreakValue');
  const workTimeDivs = Array.from(document.getElementsByClassName('work-time-div'));
  const longBreakDiv = document.getElementsByClassName('long-break-div')[0];
  const shortBreakDivs = Array.from(document.getElementsByClassName('short-break-div'));

  const getPercentage = () => {
    const totalTime = (+workTime.innerText * +workIteration.innerText + +shortBreak.innerText * (+workIteration.innerText - 1)) * 2 + +longBreak.innerText;

    return (100 / totalTime);
  };

  const renderScale = () => {
    const scaleItems = Array.from(document.getElementsByClassName('scale-item'));
    const totalTime = +workTime.innerText * +workIteration.innerText + +shortBreak.innerText * (+workIteration.innerText - 1);
    const endCycleTime = document.getElementsByClassName('end-cycle')[0];
    const hours = `${Math.floor((totalTime * 2 + +longBreak.innerText) / 60)}h`;
    const minutes = ` ${(totalTime * 2 + +longBreak.innerText) % 60}m`;

    endCycleTime.innerText = hours + minutes;
    scaleItems.forEach((item, index) => {
      if ((index + 1) * 30 < (totalTime * 2 + +longBreak.innerText)) {
        item.classList.remove('display-none');
        item.style.left = `calc(${((index + 1) * 30) * getPercentage()}% - ${parseInt(window.getComputedStyle(item).width) - 5}px)`;
      } else {
        item.classList.add('display-none');
      }
    });
  };

  const firstCycle = () => {
    const firstCycleElem = document.getElementsByClassName('first-cycle')[0];
    const firstCycleMin = (+workTime.innerText * +workIteration.innerText + +shortBreak.innerText * (+workIteration.innerText - 1)) * 2 + +longBreak.innerText;
    firstCycleElem.innerText = `First cycle: ${Math.floor(firstCycleMin / 60)}h ${firstCycleMin % 60}m`;
  };

  const workTimeRender = () => {
    workTimeDivs.forEach((div) => {
      div.style.width = `${+workTime.innerText * getPercentage()}%`;
    });
  };


  const longBreakRender = () => {
    longBreakDiv.style.width = `${+longBreak.innerText * getPercentage()}%`;
  };

  const shortBreakRender = () => {
    shortBreakDivs.forEach((div) => {
      div.style.width = `${+shortBreak.innerText * getPercentage()}%`;
    });
  };

  const renderAll = () => {
    workTimeRender();
    shortBreakRender();
    longBreakRender();
    workIterationRender();
    firstCycle();
    renderScale();
  };

  const workIterationRender = () => {

    const blockCountToRemove = 5 - parseInt(document.getElementById('workIterationValue').innerText);
    workTimeDivs.forEach(div => {
      div.classList.remove('display-none');
    });

    shortBreakDivs.forEach(div => {
      div.classList.remove('display-none');
    });

    if (blockCountToRemove) {
      for (let i = 0; i < blockCountToRemove; i++) {
        workTimeDivs[i].classList.toggle('display-none');
        workTimeDivs[workTimeDivs.length - 1 - i].classList.toggle('display-none');
        shortBreakDivs[i].classList.toggle('display-none');
        shortBreakDivs[shortBreakDivs.length - 1 - i].classList.toggle('display-none');
      }
    }
  };

  const workTimeVoterOptions = {
    minValue: 15,
    maxValue: 25,
    step: 5,
    element: document.getElementById('workTime'),
    render: renderAll
  };

  const longBreakVoterOptions = {
    minValue: 15,
    maxValue: 30,
    step: 5,
    element: document.getElementById('longBreak'),
    render: renderAll
  };

  const workIterationVoterOptions = {
    minValue: 2,
    maxValue: 5,
    step: 1,
    element: document.getElementById('workIteration'),
    render: renderAll
  };

  const shortBreakVoterOptions = {
    minValue: 3,
    maxValue: 5,
    step: 1,
    element: document.getElementById('shortBreak'),
    render: renderAll
  };

  new Voter(workTimeVoterOptions);
  new Voter(longBreakVoterOptions);
  new Voter(workIterationVoterOptions);
  new Voter(shortBreakVoterOptions);

  renderAll();
}