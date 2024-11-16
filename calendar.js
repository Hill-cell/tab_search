class Calendar {
    constructor(container) {
        this.container = container;
        this.date = new Date();
        this.today = new Date();
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                          '七月', '八月', '九月', '十月', '十一月', '十二月'];

        let html = `
            <div class="calendar-header">
                <button class="prev-month">◀</button>
                <h3>${year}年 ${monthNames[month]}</h3>
                <button class="next-month">▶</button>
            </div>
            <div class="calendar-body">
                <div class="weekdays">
                    <div>日</div><div>一</div><div>二</div><div>三</div>
                    <div>四</div><div>五</div><div>六</div>
                </div>
                <div class="days">
        `;

        // 填充上个月的日期
        const prevMonthLastDate = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="day empty">${prevMonthLastDate - i}</div>`;
        }

        // 填充当前月的日期
        for (let i = 1; i <= lastDate; i++) {
            const isToday = this.isToday(year, month, i);
            const isSelected = this.isSelected(year, month, i);
            const classes = ['day'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            
            html += `<div class="${classes.join(' ')}" data-date="${year}-${month + 1}-${i}">${i}</div>`;
        }

        // 填充下个月的日期
        const remainingDays = 42 - (firstDay + lastDate);
        for (let i = 1; i <= remainingDays; i++) {
            html += `<div class="day empty">${i}</div>`;
        }

        html += `
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    bindEvents() {
        // 上个月按钮
        this.container.querySelector('.prev-month').addEventListener('click', () => {
            let newYear = this.date.getFullYear();
            let newMonth = this.date.getMonth() - 1;
            
            if (newMonth < 0) {
                newMonth = 11;
                newYear--;
            }
            
            this.date = new Date(newYear, newMonth, 1);
            this.render();
        });

        // 下个月按钮
        this.container.querySelector('.next-month').addEventListener('click', () => {
            let newYear = this.date.getFullYear();
            let newMonth = this.date.getMonth() + 1;
            
            if (newMonth > 11) {
                newMonth = 0;
                newYear++;
            }
            
            this.date = new Date(newYear, newMonth, 1);
            this.render();
        });

        // 日期点击事件
        this.container.querySelector('.days').addEventListener('click', (e) => {
            const dayElement = e.target.closest('.day');
            if (dayElement && !dayElement.classList.contains('empty')) {
                const [year, month, day] = dayElement.dataset.date.split('-').map(Number);
                this.selectedDate = new Date(year, month - 1, day);
                this.render();
                
                const event = new CustomEvent('dateSelect', {
                    detail: { date: this.selectedDate }
                });
                this.container.dispatchEvent(event);
            }
        });
    }

    isToday(year, month, day) {
        return year === this.today.getFullYear() &&
               month === this.today.getMonth() &&
               day === this.today.getDate();
    }

    isSelected(year, month, day) {
        return this.selectedDate &&
               year === this.selectedDate.getFullYear() &&
               month === this.selectedDate.getMonth() &&
               day === this.selectedDate.getDate();
    }
} 