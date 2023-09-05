// Return range list based on day,month,year
export function getDateRange(type: string = "week", count: number = 0): any {
  let result = [];
  let dtObj, expm, actm, recentObj, tmpArr;
  for (let i = 0; i < count; i++) {
    dtObj = new Date();
    dtObj.setUTCHours(0, 0, 0, 0);
    if (type == "month") {
      expm = dtObj.getMonth() - i;
      expm = expm < 0 ? 12 + expm : expm;
      dtObj.setMonth(dtObj.getMonth() - i);
      actm = dtObj.getMonth();
      if (expm != actm) {
        while (dtObj.getMonth() === actm) {
          dtObj.setDate(dtObj.getDate() - 1);
        }
      }
    } else if (type == "year") {
      dtObj.setUTCFullYear(dtObj.getUTCFullYear() - i);
    } else if (type == "day") {
      dtObj.setUTCDate(dtObj.getUTCDate() - i);
    } else {
      if (recentObj) {
        recentObj.setDate(recentObj.getDate() - 1);
        tmpArr = getWeekBounds(recentObj);
      } else {
        tmpArr = getWeekBounds(dtObj);
      }
      recentObj = tmpArr[0];
      dtObj = tmpArr[0];
    }
    result.push(new Date(dtObj.toISOString()));
  }
  return result.reverse();
}
export const getWeekBounds = (inputDate) => {
  let tmpDate = new Date(inputDate.toISOString().substr(0, 10));
  let fdIndex = tmpDate.getDay();
  const weekStart = new Date(tmpDate.setDate(tmpDate.getDate() - fdIndex));
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return [weekStart, weekEnd];
};
export const getFormattedDateString = (
  inputDate: Date,
  type = "week"
): string => {
  let retstr;
  if (type == "month") {
    retstr = inputDate.toISOString().substr(0, 7);
  } else if (type == "year") {
    retstr = inputDate.toISOString().substr(0, 4);
  } else if (type == "day") {
    retstr = inputDate.toISOString().substr(0, 10);
  } else {
    //day & week
    retstr = inputDate.toLocaleDateString();
  }
  return retstr;
};
export const matchGraphDate = (val, type = "week") => {
  return function (element) {
    let srcVal = getFormattedDateString(val, type);
    return element.rowDateFormat == srcVal;
  };
};
export const getGraphLabel = (val, type = "week"): string => {
  let label;
  if (type == "month") {
    label = val.toLocaleString("default", { month: "short" });
  } else if (type == "year") {
    label = val.getFullYear().toString();
  } else if (type == "day") {
    label = val.toLocaleString("default", { weekday: "short" });
  } else {
    let weekArr = getWeekBounds(val);
    label = weekArr[0].toLocaleDateString();
  }
  return label;
};
export const getDateOfWeek = (toWeek, toYear) => {
  let dayStart = new Date(toYear, 0, 1).getDay(); // get week day of January 1st
  let toDate = dayStart + (1 + (toWeek - 1) * 7); // 1st of January + 7 days for each week
  return new Date(toYear, 0, toDate);
};
export function getIsoDateTime(newDate: Date) {
  return newDate.toISOString().replace("T", " ").slice(0, 19);
}
