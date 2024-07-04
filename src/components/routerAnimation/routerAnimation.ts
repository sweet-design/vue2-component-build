import Vue from 'vue';
export default {
	init(router: any) {
		Object.defineProperties(router.prototype, {
			togo: {
				value: function(path: any) {
					if (path.params) {
						(Vue as any).ls.set(path.name, path.params);
						delete path.params;
					}
					this.isleft = true;
					this.isright = false;
					this.push(path);
				}
			},
			togoReplace: {
				value: function(path: any) {
					if (path.params) {
						(Vue as any).ls.set(path.name, path.params);
						delete path.params;
					}
					this.isleft = true;
					this.isright = false;
					this.replace(path);
				}
			},
			goRight: {
				value: function(path: string) {
					this.isright = true;
					this.isleft = false;
					this.push(path);
				}
			},
			goBack: {
				value: function() {
					this.isright = true;
					this.isleft = false;
					this.go(-1);
				}
			},
			togoback: {
				value: function() {
					this.isright = true;
					this.isleft = false;
				}
			},
			togoin: {
				value: function() {
					this.isright = false;
					this.isleft = true;
				}
			}
		});
	},
	/**
	 * 初始化浏览器回退前进事件
	 * @param callback 回调函数
	 */
	popstate(callback: Function) {
		let init = 0;
		window.addEventListener(
			'popstate',
			function(e) {
				init++;
				if (init < 2) {
					callback();
				}
			},
			false
		);
	},
	checkstate(router: any, to: any, from: any) {
		const arr1 = to.path.split('/');
		const arr2 = from.path.split('/');
		if (arr1.length === 2) {
			if (arr1[1].length === 0) {
				arr1.splice(1, 1);
			}
		}
		if (arr2.length === 2) {
			if (arr2[1].length === 0) {
				arr2.splice(1, 1);
			}
		}
		if (arr1.length < arr2.length) {
			router.togoback();
		} else {
			router.togoin();
		}
	}
};
