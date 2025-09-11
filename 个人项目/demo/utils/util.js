/**
 * 检查登录状态并重定向
 * @param {Object} pageContext - 页面上下文，用于调用页面方法
 * @param {Function} onLoggedIn - 登录成功后的回调函数
 * @param {string} redirectUrl - 未登录时重定向的URL，默认为 '/pages/profile/profile'
 */
function checkLoginAndRedirect(pageContext, onLoggedIn, redirectUrl = '/pages/profile/profile') {
    const isLoggedIn = wx.getStorageSync('userToken') ? true : false
    
    if (!isLoggedIn) {
        // 未登录，跳转到登录页面
        wx.switchTab({
            url: redirectUrl
        })
        return false
    }
    
    // 已登录，执行回调函数
    if (onLoggedIn && typeof onLoggedIn === 'function') {
        onLoggedIn.call(pageContext)
    }
    
    return true
}
 
/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
    return wx.getStorageSync('userToken') ? true : false
}

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatDate(date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    return [year, month, day].map(formatNumber).join('-');
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 判断两个日期相差天数
 */
function getDays(strDateStart, strDateEnd) {
    var strSeparator = "-"; //日期分隔符
    var oDate1;
    var oDate2;
    var iDays;
    oDate1 = strDateStart.split(strSeparator);
    oDate2 = strDateEnd.split(strSeparator);
    var strDateS = new Date(oDate1[0], oDate1[1] - 1, oDate1[2]);
    var strDateE = new Date(oDate2[0], oDate2[1] - 1, oDate2[2]);
    iDays = parseInt(Math.abs(strDateS - strDateE) / 1000 / 60 / 60 / 24)//把相差的毫秒数转换为天数 
    return iDays;
}

function dateToString(now) {
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString();
    var day = (now.getDate()).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    if (day.length == 1) {
        day = "0" + day;
    }
    var dateTime = year + "-" + month + "-" + day ;
    return dateTime;
}  


const isNull = str => {
    if (str == null || str == undefined || str == '') {
        return true;
    } else {
        return false;
    }
}

module.exports = {
  formatTime: formatTime,
  isNull: isNull,
  getDays: getDays,
  dateToString: dateToString,
  formatDate: formatDate,
  checkLoginAndRedirect: checkLoginAndRedirect,
  isLoggedIn: isLoggedIn
}
