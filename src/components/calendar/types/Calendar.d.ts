import { CohoComponent } from './component';

export class Calendar extends CohoComponent {
	/**
	 * 星期天是否默认显示在最左侧
	 * @default false
	 */
	left?: boolean;

	/**
	 * 是否显示标题 年月日
	 * @default false
	 */
	title?: boolean;

	/**
	 * 是否显示月份背景水印
	 * @default true
	 */
	showMark?: boolean;

	/**
	 * 默认显示方式 支持两种 week, month
	 * @default 'month'
	 */
	showType?: string;

	/**
	 * 是否支持月与周之间切换
	 * @default true
	 */
	isSwitch?: boolean;

	/**
	 * 切换时是否选中当前月的1号，true 选中每个月的1号，false 继承上个月选中的号数，如果在选中的号数上没有此号，默认往前进一位，以此类推
	 * showType 为week方式时，默认选中第一天
	 * @default true
	 */
	first?: boolean;

	/**
	 * 可选的最小日期，默认当前月
	 */
	minDate?: Date;

	/**
	 * 可选的最大日期，默认当前日期的六个月后
	 */
	maxDate?: Date;

	/**
	 * 初始默认选中的日期，默认当天
	 */
	defaultDate?: string;

	/**
	 * 选中的项的背景色
	 * @default #074e35
	 */
	activeColor?: string;

	/**
	 * 日历当天选项背景色
	 * @default #d1faec
	 */
	currentColor?: string;

	/**
	 * 是否显示农历信息，目前没实现
	 * @default false
	 */
	lunar?: boolean;
}
