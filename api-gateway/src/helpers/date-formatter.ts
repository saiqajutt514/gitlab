export const getWeekBounds = inputDate => {
  let fdIndex = inputDate.getDate() - inputDate.getDay();
  let ldIndex = fdIndex + 6;

  const weekStart = new Date(inputDate.setDate(fdIndex));
  weekStart.setUTCHours(0,0,0,0)
  const weekEnd = new Date(inputDate.setDate(ldIndex));
  weekEnd.setUTCHours(0,0,0,0)
  return [weekStart, weekEnd]
}

export function getFromToDates(type:string = 'week', count:number = 7): { fromDate:Date, toDate:Date } {
  let result = [];
  let dtObj, expm, actm, recentObj, tmpList;
  for (let i = 0; i < count; i++) {
    dtObj = new Date();
    dtObj.setUTCHours(0,0,0,0);
    if (type == 'month') {
      expm = dtObj.getMonth() - i;
      expm = expm < 0 ? 12 + expm : expm
      dtObj.setMonth(dtObj.getMonth() - i);
      actm = dtObj.getMonth();
      if (expm != actm) {
        while (dtObj.getMonth() === actm) {
          dtObj.setDate(dtObj.getDate() - 1);
        }
      }
    } else if (type == 'year') {
      dtObj.setUTCFullYear(dtObj.getUTCFullYear() - i);
    } else if (type == 'day') {
      dtObj.setUTCDate(dtObj.getUTCDate() - i);
    } else {
      if (recentObj) {
        recentObj.setDate(recentObj.getDate() - 1);
        tmpList = getWeekBounds(recentObj);
      } else {
        tmpList = getWeekBounds(dtObj);
      }
      recentObj = tmpList[0]
      dtObj = tmpList[0]
    }
    result.push(new Date(dtObj.toISOString()))
  }
  let fromDate = result[result.length-1];
  let toDate = result[0];
  if (type == 'week') {
    tmpList = getWeekBounds(toDate);
    toDate = tmpList[1]
  }
  toDate.setUTCHours(23,59,59,999);
  return { fromDate, toDate };
}

export function handleDashboardDateParams(params) {
  let bounds = getFromToDates(params.type);
  let retdata = {
    fromDate: params.fromDate??bounds.fromDate,
    toDate: params.toDate??bounds.toDate
  }
  return retdata
}

export function getTimestamp(seconds = 0): string {
  const date = new Date();
  if (seconds) {
    date.setSeconds(date.getSeconds() + seconds);
  }
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export function getIsoDateTime(newDate: Date) {
  return newDate.toISOString().replace("T", " ").slice(0, 19);
}
