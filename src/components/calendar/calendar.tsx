import Vue, { CreateElement } from 'vue';
import Component, { mixins } from 'vue-class-component';
import { Prop, Emit, Watch, Model, Inject, Provide } from 'vue-property-decorator';
import dayjs, { Dayjs } from 'dayjs';
import './calendar.less';

interface CalendarData {
	/**
	 * 当前月的1号
	 */
	currentDate: Dayjs;
	/**
	 * 格式化当前月
	 */
	currentFormat: string;
	/**
	 * 每个月的所有数据
	 */
	allDate: Array<Array<CalendarItem>>;
}

interface CalendarItem {
	/**
	 * 当天日期
	 */
	date: Dayjs;
	/**
	 * 格式化的日期字符串
	 */
	format: string;
	/**
	 * 格式化的日期字符串 年-月
	 */
	son: string;
	/**
	 * 当天日期的月份
	 */
	month: number;
	/**
	 * 状态码
	 */
	status: number;
}

@Component({ name: 'Calendar' })
export default class Calendar extends Vue {
	/**
	 * 星期天是否默认显示在最左侧
	 */
	@Prop({
		type: Boolean,
		default: false,
		required: false
	})
	private readonly left!: boolean;

	/**
	 * 是否显示标题 年月日
	 */
	@Prop({
		type: Boolean,
		default: false,
		required: false
	})
	private readonly title!: boolean;

	/**
	 * 是否显示月份背景水印
	 */
	@Prop({
		type: Boolean,
		default: true,
		required: false
	})
	private readonly showMark!: boolean;

	/**
	 * 默认显示方式 支持两种 week, month
	 */
	@Prop({
		type: String,
		default: 'month',
		required: false
	})
	private readonly showType!: string;

	/**
	 * 是否支持月与周之间切换
	 */
	@Prop({
		type: Boolean,
		default: true,
		required: false
	})
	private readonly isSwitch!: boolean;

	/**
	 * 切换时是否选中当前月的1号，true 选中每个月的1号，false 继承上个月选中的号数，如果在选中的号数上没有此号，默认往前进一位，以此类推
	 * showType 为week方式时，默认选中第一天
	 */
	@Prop({
		type: Boolean,
		default: true,
		required: false
	})
	private readonly first!: boolean;

	/**
	 * 可选的最小日期，默认当前月
	 */
	@Prop({
		type: Date,
		default: () => {
			return new Date();
		},
		required: false
	})
	private readonly minDate!: Date;

	/**
	 * 可选的最大日期，默认当前日期的六个月后
	 */
	@Prop({
		type: Date,
		default: () => {
			return dayjs().add(6, 'month').toDate();
		},
		required: false
	})
	private readonly maxDate!: Date;

	/**
	 * 初始默认选中的日期，默认当天
	 */
	@Prop({
		type: String,
		default: dayjs().format('YYYY-MM-DD'),
		required: false
	})
	private defaultDate!: string;

	/**
	 * 选中的项的背景色
	 */
	@Prop({
		type: String,
		default: '#074e35',
		required: false
	})
	private readonly activeColor!: string;

	/**
	 * 日历当天选项背景色
	 */
	@Prop({
		type: String,
		default: '#d1faec',
		required: false
	})
	private readonly currentColor!: string;

	/**
	 * 是否显示农历信息
	 */
	@Prop({
		type: Boolean,
		default: false,
		required: false
	})
	private readonly lunar!: boolean;

	private monToSat: Array<string> = ['一', '二', '三', '四', '五', '六'];
	private sunday: Array<string> = ['日'];

	private today = dayjs().format('YYYY-MM-DD');

	private days: Array<CalendarData> = []; // 待渲染的日期对象信息
	private daysCopy: Array<Array<CalendarItem>> = [];
	static install: (Vue: any) => void;

	private translateX = 0; // 所有操作过程中的最终位移
	private translateXTemp = 0; // 移动过程过的临时位移
	private duration = 500; // 延迟动画时长
	private position = { x: 0, y: 0 }; // 手指或鼠标初始定位

	private translateXCopy = 0; // 所有操作过程中的最终位移
	private translateXTempCopy = 0; // 移动过程过的临时位移
	private positionCopy = { x: 0, y: 0 }; // 手指或鼠标初始定位

	private daysList: any[] = []; // 临时存放所有日历
	private selectedDay: Dayjs = dayjs(this.defaultDate); // 选中的日期
	private selectedDayStr = dayjs().format('YYYY-MM-DD');

	private selectedDayCopy: Dayjs = dayjs(); // 周模式的选中日期
	private selectedDayCopyStr = dayjs().format('YYYY-MM-DD');
	private selectedDayCopyTemp: Dayjs | null = null; // 临时对比的日期

	private allWidth = 0; // 总宽度
	private allWidthCopy = 0; // 迷你版日历总宽度
	private containerWidth = 0; // 初始化时，外层容器宽度

	private showTypeCopy = ''; // 记录当前模式切换

	private calendarwrap: any = null; // 滑动dom元素
	private calendarwrapcopy: any = null;
	private isClick = false; // 是否执行点击事件

	@Watch('msg')
	protected onChanger(newV: string, oldV: string) {
		console.log(newV, oldV);
	}

	@Emit()
	protected addToCount(n: number): any {}

	get weekdays() {
		return this.left ? [...this.sunday, ...this.monToSat] : [...this.monToSat, ...this.sunday];
	}

	// 切换点击时 计算当前选中的是周几
	get week() {
		const day = this.selectedDay.day();
		return this.left ? this.weekdays[day] : day === 0 ? this.weekdays[6] : this.weekdays[day - 1];
	}

	/**
	 * 创建周日历
	 * @param data 日历数据
	 */
	createdSonCalendar(data: Array<CalendarData>) {
		const first = data[0].allDate[0][0].date.clone();
		const last = data[data.length - 1].allDate[4][6].date;
		const leng = last.diff(first, 'day') / 7;

		let base = 0;
		for (let i = 0; i <= leng; i++) {
			const temp = [];
			for (let j = 0; j < 7; j++) {
				const date = first.add(base + j, 'day');

				temp.push({
					date: date,
					month: date.month(),
					format: date.format('YYYY-MM-DD'),
					son: date.format('YYYY-MM'),
					status: 200
				});
				if (j == 6) {
					base += 7;
				}
			}

			this.daysCopy.push(temp);
		}
	}

	distance(date: Dayjs) {
		const first = this.daysCopy[0][0].date;
		const x = Math.floor(date.diff(first, 'day') / 7);
		const zhi = -(x * this.containerWidth);
		this.translateXCopy = zhi;
		this.calendarwrapcopy.style.transform = `translateX(${zhi}px)`;
		this.calendarwrapcopy.style['transition-duration'] = `0ms`;
	}

	mounted() {
		this.containerWidth = (this.$refs.calendar as any).clientWidth; // 最外层容器大小

		this.showTypeCopy = this.showType;
		this.loopfor(dayjs(this.minDate));

		this.days = [...this.daysList];

		this.createdSonCalendar(this.days); // 创建迷你版日历

		this.calendarwrap = this.$refs.calendarwrap;
		this.calendarwrapcopy = this.$refs.calendarwrapcopy;

		this.allWidth = this.containerWidth * this.days.length;
		this.allWidthCopy = this.containerWidth * this.daysCopy.length;

		if (this.showType === 'month') {
			// (this.$refs.jiantou as any).classList.add('mobile-icon-zhankai-up');
			// 今天所在的月在所有日历中所处的索引
			const index = this.days.findIndex((item) => item.currentDate.diff(dayjs(), 'month') === 0);

			this.translateX = -(this.containerWidth * index);

			this.calendarwrap.style.display = '';
			this.calendarwrapcopy.style.display = 'none';

			this.setParams(this.calendarwrap, this.translateX, 0);
		} else {
			// (this.$refs.jiantou as any).classList.add('mobile-icon-zhankai-down');
			this.calendarwrap.style.display = 'none';
			this.calendarwrapcopy.style.display = '';

			const dis = Math.floor(dayjs().diff(this.daysCopy[0][0].date, 'day') / 7);
			this.translateXCopy = -(dis * this.containerWidth);

			this.setParams(this.calendarwrapcopy, this.translateXCopy, 0);
			// const month = dayjs().diff(this.days[0].currentDate, 'month'); // 今天与日历第一个月相差几月
			// const index = this.getDateIndex(dayjs()).out;
			// this.translateX = -(this.containerWidth * (month * 5 + index));
			// this.allWidth = this.containerWidth * (this.days.length * 5);
		}

		this.getDayMessage(this.selectedDay);
	}

	/**
	 * 设置dom样式
	 * @param translateX 整体相对位移
	 * @param duration 动画延迟数值
	 */
	setParams(dom: any, translateX: number, duration: number) {
		dom.style['transition-duration'] = `${duration}ms`;
		dom.style.transform = `translateX(${translateX}px)`;
	}

	/**
	 * 获取指定日期在当前月中的索引
	 * @param date 指定日期
	 * @returns {object} 索引对象
	 * @returns in 当前日在当前月中行所在的索引
	 * @returns out 当前日在当前月的当前行中列所在的索引
	 */
	getDateIndex(date: string): { in: number; out: number } {
		const aaa = Math.abs(this.translateX / this.containerWidth);
		const monthData = this.days[aaa].allDate;
		let index = { in: 0, out: 0 };
		for (let i = 0; i < monthData.length; i++) {
			const idx = monthData[i].findIndex((item) => item.format === date);

			if (idx > 0) index = { in: idx, out: i };
		}

		return index;
	}

	/**
	 * 递归组装日期数据
	 * @param date 每月的第一天
	 */
	loopfor(date: Dayjs) {
		if (date.diff(dayjs(this.maxDate), 'month') > 0) return;
		this.daysList.push(this.initDate(date.format('YYYY-MM-DD')));
		this.loopfor(date.add(1, 'month'));
	}

	@Emit('change')
	protected getDayMessage(date: Dayjs) {
		this.selectedDay = this.selectedDayCopy = date;
		this.selectedDayStr = this.selectedDayCopyStr = this.selectedDay.format('YYYY-MM-DD');
		return date.toDate();
	}

	/**
	 * 初始化日历
	 * @param data 当前月份信息
	 */
	private initDate(data: string): CalendarData {
		const curDate = dayjs(data).startOf('month'); // 取当前月的1号

		// 当前周几
		const week = curDate.day() == 0 ? 7 : curDate.day();
		const [left, right] = this.left ? [week + 1, 42 - week - 1] : [week, 42 - week];

		const temp = [];
		for (let i = left - 1; i > 0; i--) {
			const date = curDate.subtract(i, 'day');
			temp.push({
				date: date,
				format: date.format('YYYY-MM-DD'),
				son: date.format('YYYY-MM'),
				month: date.month(),
				status: 200
			});
		}

		for (let j = 0; j <= right; j++) {
			const date = curDate.add(j, 'day');
			temp.push({
				date: date,
				format: date.format('YYYY-MM-DD'),
				son: date.format('YYYY-MM'),
				month: date.month(),
				status: 200
			});
		}

		const dateList: any[] = this.Datas(temp, 7);

		return { currentDate: curDate, currentFormat: curDate.format('YYYY-MM'), allDate: dateList };
	}

	Datas(data: any, num: any) {
		let index = 0;
		let array = [];
		while (index < data.length) {
			array.push(data.slice(index, (index += num)));
		}

		return array;
	}

	protected touchStartCopy(e: TouchEvent) {
		this.translateXTempCopy = this.translateXCopy;

		this.setParams(this.calendarwrapcopy, this.translateXCopy, 0);

		this.positionCopy = {
			x: e.targetTouches[0].pageX,
			y: e.targetTouches[0].pageY
		};
	}

	protected touchMoveCopy(e: TouchEvent) {
		e.stopPropagation();
		const x = e.targetTouches[0].pageX;
		const cha = x - this.positionCopy.x;

		this.translateXCopy = this.translateXTempCopy + cha;
		if (this.translateXCopy <= 0 && this.translateXCopy >= -(this.allWidthCopy - this.containerWidth)) {
			this.calendarwrapcopy.style.transform = `translateX(${this.translateXCopy}px)`;
		}
	}

	protected touchEndCopy(e: TouchEvent) {
		const displacement = e.changedTouches[0].pageX - this.positionCopy.x;
		this.isClick = displacement == 0;

		if (Math.abs(displacement) > 100) {
			if (displacement < 0) {
				this.translateXCopy = this.translateXTempCopy - this.containerWidth;

				if (this.translateXCopy < -(this.allWidthCopy - this.containerWidth)) {
					this.translateXCopy = -(this.allWidthCopy - this.containerWidth);
					return;
				}
			} else {
				this.translateXCopy = this.translateXTempCopy + this.containerWidth;
				if (this.translateXCopy > 0) {
					this.translateXCopy = 0;
					return;
				}
			}
		} else {
			this.translateXCopy = this.translateXTempCopy;
			this.setParams(this.calendarwrapcopy, this.translateXCopy, this.duration);
			return;
		}

		this.setParams(this.calendarwrapcopy, this.translateXCopy, this.duration);

		if (this.translateXCopy < this.translateXTempCopy) {
			// 向左滑动
			if (this.selectedDayCopyTemp != null) {
				this.selectedDayCopy = this.selectedDayCopyTemp.add(7, 'day');
				this.selectedDayCopyStr = this.selectedDayCopy.format('YYYY-MM-DD');
				this.selectedDayCopyTemp = this.selectedDayCopy.clone();
			} else {
				this.selectedDayCopy = this.selectedDayCopy.add(7, 'day');
				this.selectedDayCopyStr = this.selectedDayCopy.format('YYYY-MM-DD');
			}
		} else {
			// 向右滑动
			if (this.selectedDayCopyTemp != null) {
				this.selectedDayCopy = this.selectedDayCopyTemp.subtract(7, 'day');
				this.selectedDayCopyStr = this.selectedDayCopy.format('YYYY-MM-DD');
				this.selectedDayCopyTemp = this.selectedDayCopy.clone();
			} else {
				this.selectedDayCopy = this.selectedDayCopy.subtract(7, 'day');
				this.selectedDayCopyStr = this.selectedDayCopy.format('YYYY-MM-DD');
			}
		}

		this.getDayMessage(this.selectedDayCopy);
	}

	// 滑动开始
	protected touchStart(e: TouchEvent) {
		this.translateXTemp = this.translateX;

		this.setParams(this.calendarwrap, this.translateX, 0);

		this.position = {
			x: e.targetTouches[0].pageX,
			y: e.targetTouches[0].pageY
		};
	}

	protected touchMove(e: TouchEvent) {
		e.stopPropagation();
		const x = e.targetTouches[0].pageX;
		const cha = x - this.position.x;

		this.translateX = this.translateXTemp + cha;
		if (this.translateX <= 0 && this.translateX >= -(this.allWidth - this.containerWidth)) {
			this.calendarwrap.style.transform = `translateX(${this.translateX}px)`;
		}
	}

	// 滑动结束
	protected touchEnd(e: TouchEvent) {
		const displacement = e.changedTouches[0].pageX - this.position.x; // 位移值
		this.isClick = displacement == 0;

		if (Math.abs(displacement) > 100) {
			if (displacement < 0) {
				this.translateX = this.translateXTemp - this.containerWidth;

				if (this.translateX < -(this.allWidth - this.containerWidth)) {
					this.translateX = -(this.allWidth - this.containerWidth);
					return;
				}
			} else {
				this.translateX = this.translateXTemp + this.containerWidth;
				if (this.translateX > 0) {
					this.translateX = 0;
					return;
				}
			}
		} else {
			this.translateX = this.translateXTemp;
			this.setParams(this.calendarwrap, this.translateX, this.duration);
			return;
		}

		this.setParams(this.calendarwrap, this.translateX, this.duration);

		const index = Math.abs(this.translateX / this.containerWidth); // 当前月份所在的索引
		const currentMonth = this.days[index]; // 当前月数据信息

		if (this.first) {
			this.selectedDay = currentMonth.currentDate;
		} else {
			const month = currentMonth.currentDate.month(); // 当前月份
			const date = this.selectedDay.date(); // 切换结束前选中的日

			const arr = [];
			for (let j = 0; j < currentMonth.allDate.length; j++) {
				for (let z = 0; z < currentMonth.allDate[j].length; z++) {
					if (currentMonth.allDate[j][z].month === month) {
						arr.push(currentMonth.allDate[j][z].date.date());
					}
				}
			}

			const maxDate = Math.max.apply(null, arr);
			if (date > maxDate) {
				this.selectedDay = currentMonth.currentDate.set('date', maxDate);
			} else {
				this.selectedDay = currentMonth.currentDate.set('date', date);
			}
		}

		this.getDayMessage(this.selectedDay);
	}

	protected render(h: CreateElement) {
		return (
			<div class="calendar-component-container" ref="calendar">
				{this.$scopedSlots.title
					? this.$scopedSlots.title({
							date: this.selectedDay
					  })
					: this.title && (
							<div class="year-month">
								{/* <div>
									{this.selectedDay.year()}年/{this.selectedDay.month() + 1}月/
									{this.selectedDay.date()}日 周{this.week}
								</div> */}
								<div>{this.selectedDay.format('YYYY-MM')}</div>
							</div>
					  )}
				<ul class="weekdays">
					{this.weekdays.map((item, index) => {
						return <li key={index}>{item}</li>;
					})}
				</ul>
				<div
					class="calendar-wrap"
					ref="calendarwrapcopy"
					ontouchstart={this.touchStartCopy.bind(this)}
					ontouchend={this.touchEndCopy.bind(this)}
					ontouchmove={this.touchMoveCopy.bind(this)}
					{...{ style: { width: this.allWidthCopy + 'px' } }}
				>
					{this.daysCopy.map((element) => {
						return (
							<div
								class="content-body"
								{...{
									style: {
										width: this.containerWidth + 'px'
									}
								}}
							>
								<div class="days">
									{element.map((item: any, index: number) => {
										return (
											<div class="row-box">
												<div
													{...{
														class: {
															item: true
														}
													}}
												>
													{
														<div
															{...{
																class: {
																	everyDay: true,
																	today: item.format === this.today,
																	fadeWidth: this.selectedDayCopyStr === item.format
																},
																style: {
																	backgroundColor:
																		this.selectedDayStr === item.format
																			? this.activeColor
																			: item.format === this.today
																			? this.currentColor
																			: ''
																}
															}}
															onClick={() => {
																if (
																	this.isClick &&
																	item.format !== this.selectedDayCopyStr
																) {
																	this.getDayMessage(item.date);
																}
															}}
														>
															{this.$scopedSlots.element ? (
																this.$scopedSlots.element({
																	date: item.date
																})
															) : (
																<div>{item.date.date()}</div>
															)}
														</div>
													}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
				<div
					class="calendar-wrap"
					ref="calendarwrap"
					ontouchstart={this.touchStart.bind(this)}
					ontouchend={this.touchEnd.bind(this)}
					ontouchmove={this.touchMove.bind(this)}
					{...{ style: { width: this.allWidth + 'px' } }}
				>
					{this.days.map((element) => {
						return (
							<div
								class="content-body"
								{...{
									style: {
										width: this.containerWidth + 'px'
									}
								}}
							>
								<div class="days">
									{this.showMark && (
										<div class="calendar-month-mark">{element.currentDate.month() + 1}</div>
									)}
									{element.allDate.map((item: any, index: number) => {
										return (
											<div class="row-box">
												{item.map((sub: any, num: number) => {
													return (
														<div
															{...{
																class: {
																	item: true,
																	weekend: (num + 2) % 7 === 0 || (num + 1) % 7 === 0
																}
															}}
														>
															{
																<div
																	{...{
																		class: [
																			sub.son !== element.currentFormat
																				? 'other-month'
																				: 'everyDay',
																			this.selectedDayStr === sub.format
																				? 'fadeWidth'
																				: ''
																		],
																		style: {
																			backgroundColor:
																				this.selectedDayStr === sub.format
																					? this.activeColor
																					: sub.format === this.today
																					? this.currentColor
																					: ''
																		}
																	}}
																	onClick={() => {
																		if (
																			this.isClick &&
																			sub.format !== this.selectedDayStr
																		) {
																			this.getDayMessage(sub.date);
																		}
																	}}
																>
																	{this.$scopedSlots.element ? (
																		this.$scopedSlots.element({
																			date: sub.date
																		})
																	) : (
																		<div>{sub.date.date()}</div>
																	)}
																</div>
															}
														</div>
													);
												})}
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
				<div
					class="divider-according"
					onClick={() => {
						this.calendarwrap.style['transition-duration'] = '0ms';

						if (this.showTypeCopy == 'month') {
							// (this.$refs.jiantou as any).classList.remove('mobile-icon-zhankai-up');
							// (this.$refs.jiantou as any).classList.add('mobile-icon-zhankai-down');
							this.showTypeCopy = 'week';
							this.calendarwrap.style.display = 'none';
							this.calendarwrapcopy.style.display = '';

							const monthIndex = Math.abs(this.translateX / this.containerWidth); // 当前月份所在的索引
							const obj = this.days[monthIndex].currentFormat;
							const state = this.selectedDay.format('YYYY-MM') == obj;
							const index = this.getDateIndex(this.selectedDayStr);

							if (state) {
								this.distance(this.selectedDay);
								this.selectedDayCopyTemp = this.selectedDay;
							} else {
								const date = this.days[monthIndex].allDate[0][index.in].date;
								this.selectedDayCopyTemp = date;
								this.distance(date);
							}
						} else {
							// (this.$refs.jiantou as any).classList.remove('mobile-icon-zhankai-down');
							// (this.$refs.jiantou as any).classList.add('mobile-icon-zhankai-up');
							this.showTypeCopy = 'month';
							this.calendarwrap.style.display = '';
							this.calendarwrapcopy.style.display = 'none';

							const month = this.selectedDayCopy.format('YYYY-MM');
							const index = this.days.findIndex((item) => item.currentDate.format('YYYY-MM') === month);

							this.translateX = -(index * this.containerWidth);
							this.calendarwrap.style.transform = `translateX(${this.translateX}px)`;
						}
					}}
				>
					{/* <span ref="jiantou" class="icon mobile-icon" style="font-size: 0.6rem;"></span> */}
					{this.isSwitch && <div class="according"></div>}
				</div>
			</div>
		);
	}
}
