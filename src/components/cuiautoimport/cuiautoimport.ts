const list: any = [];
const files = require.context('VIEWS/business/other', true, /\.vue|.tsx$/);
files.keys().forEach(item => {
	const obj = files(item).default;
	const text = obj.options ? files(item).default.options.compInfo.text : obj.compInfo.text;
	list.push({
		path: `/other${item.substr(1)}`.split('.')[0].toLowerCase(),
		name: item
			.substr(1)
			.split('/')
			.reverse()[0]
			.split('.')[0],
		text: text,
		component: () => import(`VIEWS/business/other${item.substr(1)}`),
		meta: { title: text, icon: '', requiresAuth: true, keepAlive: true }
	});
});

export default list;
