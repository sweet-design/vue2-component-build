const path = require('path');
const os = require('os');
let needHost = ''; // 打开的host

try {
	const network = os.networkInterfaces(); // 获得网络接口列表。
	needHost = network[Object.keys(network)[0]][1].address; // 本机ip
} catch (e) {
	needHost = 'localhost';
}

function resolve(dir) {
	return path.join(__dirname, dir);
}

module.exports = {
	devServer: {
		host: needHost,
		open: process.platform === 'win32',
		port: 80,
		https: false,
		disableHostCheck: true
	},
	css: {
		extract: false,
		sourceMap: false,
		loaderOptions: {
			less: {
				additionalData: `@import "~@/assets/less/var.less";`,
				lessOptions: {
					modifyVars: {
						// 'primary-color': '#1890ff',
						// 'link-color': '#1DA57A',
						'border-radius-base': '2px'
					},
					javascriptEnabled: true
				}
			}
		}
	},
	outputDir: 'dist/lib',
	lintOnSave: true,
	productionSourceMap: process.env.NODE_ENV !== 'production',
	chainWebpack: config => {
		config.resolve.alias
			.set('COMPONENTS', resolve('src/components'))
			.set('VIEWS', resolve('src/views'))
			.set('SERVICES', resolve('src/services'))
			.set('ASSETS', resolve('src/assets'))
			.set('UTILS', resolve('src/utils'));
	}
};
