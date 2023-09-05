export const getWeekBounds = inputDate => {
  let tmpDate = new Date(formatDate(inputDate, 'yyyy-mm-dd'))
  let fdIndex = tmpDate.getDay();
  const weekStart = new Date(tmpDate.setDate(tmpDate.getDate() - fdIndex));
  weekStart.setUTCHours(0,0,0,0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setUTCHours(23,59,59,999);
  return [weekStart, weekEnd]
}

export const getDateOfWeek = (toWeek, toYear) => {
  let dayStart = new Date(toYear, 0, 1).getDay() // get week day of January 1st
  let toDate = dayStart + (1 + (toWeek - 1) * 7); // 1st of January + 7 days for each week
  return new Date(toYear, 0, toDate);
}

export const getDateRange = (type:string = 'week'): any => {
  let result = [];
  let dtObj, count,expm, actm, oldObj, tmpList;
  if (type === 'year') {
    count = 12;
  } else if (type === 'month') {
    count = 5;
  } else if (type === 'week') {
    count = 7;
  } else {
    count = 1;
  }
  for (let i = 0; i < count; i++) {
    dtObj = new Date();
    dtObj.setUTCHours(0,0,0,0);
    if (type === 'year') {
      expm = dtObj.getMonth() - i;
      expm = expm < 0 ? 12 + expm : expm
      dtObj.setMonth(dtObj.getMonth() - i);
      actm = dtObj.getMonth();
      if (expm != actm) {
        while (dtObj.getMonth() === actm) {
          dtObj.setDate(dtObj.getDate() - 1);
        }
      }
    } else if (type === 'month') {
      if (oldObj) {
        oldObj.setDate(oldObj.getDate() - 1);
        tmpList = getWeekBounds(oldObj);
      } else {
        tmpList = getWeekBounds(dtObj);
      }
      oldObj = tmpList[0]
      dtObj = tmpList[0]
    } else if (type === 'week') {
      dtObj.setUTCDate(dtObj.getUTCDate() - i);
    }
    result.push(formatDate(dtObj, 'yyyy-mm-dd'))
  }
  return result.reverse();
}

export const getGraphDate = (inputDate: Date, type = 'week'): string => {
  let retstr;
  if (type === 'year') {
    retstr = formatDate(inputDate, 'yyyy-mm')
  } else if (type === 'month') {
    retstr = formatDate(inputDate, 'dd/mm/yyyy')
  } else if (type === 'week') {
    retstr = formatDate(inputDate, 'dd/mm/yyyy')
  } else {
    retstr = formatDate(inputDate, 'dd/mm/yyyy')
  }
  return retstr;
}

export const matchGraphDate = (val, type = 'week') => {
  return function(element) {
    let srcVal = getGraphDate(new Date(val), type);
    let matchVal = element.rowDateFormat;
    if (type === 'month') {
      const dayValue = getDateOfWeek(Number(element.rowDateFormat), element.maxDate.getFullYear())
      const [weekStart, weekEnd] = getWeekBounds(dayValue)
      matchVal = formatDate(weekStart, 'dd/mm/yyyy');
    }
    return matchVal == srcVal;
  }
}

export const getGraphLabel = (val, type = 'week'): string => {
  let label;
  if (type === 'year') {
    label = new Date(val).toLocaleString('default', { month: 'short' })
  } else if (type === 'month') {
    const [weekStart, weekEnd] = getWeekBounds(new Date(val))
    label = `${formatDate(weekStart, 'dd/mm')} - ${formatDate(weekEnd, 'dd/mm')}`
  } else if (type === 'week') {
    // label = val.toLocaleString('default', { weekday: 'short' })
    label = formatDate(new Date(val), 'dd/mm/yyyy')
  } else {
    label = formatDate(new Date(val), 'dd/mm/yyyy')
  }
  return label;
}

export const getDateBounds = (type = 'week', mode = 'recent') => {
  let todayDate = new Date();
  todayDate.setUTCHours(0,0,0,0);

  let startDate = todayDate;
  let endDate = new Date(todayDate)
  endDate.setUTCHours(23,59,59,999);
  if (mode === "blocks") {
    if (type === 'year') {
      startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 364);
      startDate.setUTCHours(0,0,0,0);
    } else if (type === 'month') {
      const [weekStart, weekEnd] = getWeekBounds(todayDate);
      startDate = new Date(weekStart);
      startDate.setDate(weekStart.getDate() - (7 * 4))
      startDate.setUTCHours(0,0,0,0);
    } else if (type === 'week') {
      startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 6)
      startDate.setUTCHours(0,0,0,0);
    }
  } else {
    if (type === 'year') {
      startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 364);
      startDate.setUTCHours(0,0,0,0);
    } else if (type === 'month') {
      startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 29)
      startDate.setUTCHours(0,0,0,0);
    } else if (type === 'week') {
      startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - 6)
      startDate.setUTCHours(0,0,0,0);
    }
  }
  const fromDate: string = formatDate(startDate, 'yyyy-mm-dd');
  const toDate: string = formatDate(endDate, 'yyyy-mm-dd');
  return [fromDate, toDate]
}

export const getPrevBounds = (type = 'week', prev: string = '') => {
  let todayDate = new Date(prev);
  todayDate.setDate(todayDate.getDate() - 1);
  todayDate.setUTCHours(0,0,0,0);

  let startDate = todayDate;
  let endDate = new Date(todayDate)
  endDate.setUTCHours(23,59,59,999);
  if (type === 'year') {
    startDate = new Date(todayDate);
    startDate.setDate(todayDate.getDate() - 364);
    startDate.setUTCHours(0,0,0,0);
  } else if (type === 'month') {
    startDate = new Date(todayDate);
    startDate.setDate(todayDate.getDate() - 29)
    startDate.setUTCHours(0,0,0,0);
  } else if (type === 'week') {
    startDate = new Date(todayDate);
    startDate.setDate(todayDate.getDate() - 6)
    startDate.setUTCHours(0,0,0,0);
  }
  const fromDate: string = formatDate(startDate, 'yyyy-mm-dd');
  const toDate: string = formatDate(endDate, 'yyyy-mm-dd');
  return [fromDate, toDate]
}

export const formatDate = (dateVal: Date, format: string = 'yyyy-mm-dd') => {
  let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(dateVal);
  let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(dateVal);
  let moSort = new Intl.DateTimeFormat('en', { month: 'short' }).format(dateVal);
  let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(dateVal);
  if (format === 'dd/mm') {
    return `${da}/${mo}`;
  } else if (format === 'yyyy-mm') {
    return `${ye}-${mo}`;
  } else if (format === 'dd/mm/yyyy') {
    return `${da}/${mo}/${ye}`;
  } else if(format === 'do M yyyy') {
    const daySuffix = ordinalSuffix(dateVal);
    return `${daySuffix} ${moSort} ${ye}`;
  }
  else {
    return `${ye}-${mo}-${da}`;
  }
}

export const ordinalSuffix = (dt:Date) => {
  return dt.getDate()+(dt.getDate() % 10 == 1 && dt.getDate() != 11 ? 'st' : (dt.getDate() % 10 == 2 && dt.getDate() != 12 ? 'nd' : (dt.getDate() % 10 == 3 && dt.getDate() != 13 ? 'rd' : 'th')));
}

export const getDayPart = (date: string, lang: string = "EN") => {
  if(!date) {
    return '';
  }
  let data = [
    [0, 4, "night"],
    [5, 11, "morning"],          //Store messages in an array
    [12, 17, "afternoon"],
    [18, 24, "night"]
  ];

  if(lang === "AR") {
    data = [
      [0, 4, "ليل"],
      [5, 11, "صباح"],          //Store messages in an array
      [12, 17, "بعد الظهر"],
      [18, 24, "ليل"]
    ];
  }

  const today = new Date(date)
  const hr = today.getHours()

  for(let i = 0; i < data.length; i++){
    if(hr >= data[i][0] && hr <= data[i][1]){
        return `${data[i][2]}`;
    }
  }
}

export const formatAMPM = (date: Date) => {
  if(!date) {
    return '';
  }
  let hours = date.getHours();
  const minutes: number = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const min = minutes < 10 ? '0'+minutes : minutes;
  const strTime = hours + ':' + min + ' ' + ampm;
  return strTime;
}
