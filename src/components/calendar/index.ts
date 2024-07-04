import calendar from './calendar';

calendar.install = (Vue: any) => {
	if (typeof window !== 'undefined' && window.Vue && !Vue) {
		window.Vue = Vue;
	}

	Vue.component(calendar.name, calendar);
};

export default calendar;
