# -
/*
百度贴吧签到脚本

脚本修改自：https://github.com/sazs34/TaskConfig
兼容：QuantumultX、Surge4、Loon

获取Cookie说明：
打开百度贴吧App后（AppStore中国区，非内部版），点击“我的”，如通知成功获取cookie，则可以使用此签到脚本。
获取Cookie后，请禁用Cookie脚本并移除主机名，以免产生不必要的MITM。
脚本将执行每天上午9:00，可以修改执行时间。

************************
Surge 4.2.0+脚本配置：
************************

[剧本]
贴吧签到 = type=cron,cronexp=0 9 * * *,script-path=https://raw.githubusercontent.com/NobyDa/Script/master/BDTieBa-DailyBonus/TieBa.js

贴吧获取Cookie = type=http-request,pattern=https?:\/\/(c\.tieba\.baidu\.com|180\.97\.\d+\.\d+)\/c\/s\/login,script-path=https://raw.githubusercontent.com/NobyDa/Script/master/BDTieBa-DailyBonus/TieBa.js

[MITM]
hostname= c.tieba.baidu.com

************************
QuantumultX本地脚本配置：
************************

[task_local]
#贴吧签到
0 9 * * * TieBa.js

[rewrite_local]
#获取Cookie
https?:\/\/(c\.tieba\.baidu\.com|180\.97\.\d+\.\d+)\/c\/s\/login url script-request-header TieBa.js

[mitm]
hostname= c.tieba.baidu.com

************************
Loon 2.1.0+脚本配置：
************************

[剧本]
#贴吧签到
cron "0 9 * * *" script-path=https://raw.githubusercontent.com/NobyDa/Script/master/BDTieBa-DailyBonus/TieBa.js

#获取Cookie
http-request https?:\/\/(c\.tieba\.baidu\.com|180\.97\.\d+\.\d+)\/c\/s\/login script-path=https://raw.githubusercontent.com/NobyDa/Script/master/BDTieBa-DailyBonus/TieBa.js

[Mitm]
hostname= c.tieba.baidu.com


*/
var $nobyda = nobyda();
var cookieVal = $nobyda.read("CookieTB");
var useParallel = 1; //0自动切换，1串行，2并行（当贴吧数量大于30个以后，并行可能会导致QX崩溃，所以可以自动切换）
var singleNotifyCount = 99; //想签到几个汇总到一个通知里，这里就填几个（例如我有13个要签到的，这里填了5，就会分三次消息通知过去）
var process = {
总计：0，
结果：[
// {
// bar:'',
// level:0，
// exp:0，
// errorCode:0，
// errorMsg:''
// }
】
};
var url_fetch_sign = {
网址："https://tieba.baidu.com/mo/q/newmoindex",
标题：{
"内容类型": "应用程序/八字节流",
推荐人：https://tieba.baidu.com/index/tbwise/forum",
Cookie：cookieVal，
“用户代理”：“Mozilla/5.0（iPhone；CPU iPhone OS 12_0，如Mac OS X）AppleWebKit/605.1.15（KHTML，如壁虎）Mobile/16A366”
}
};
var url_fetch_add = {
网址："https://tieba.baidu.com/sign/add",
方法："POST",
标题：{
"内容类型": "application/x-www-form-urlencoded",
Cookie：cookieVal，
“用户代理”：“Mozilla/5.0（iPhone；CPU iPhone OS 10_1_1，如Mac OS X；zh-CN）AppleWebKit/537.51.1（KHTML，如Gecko）Mobile/14B100 UCBrowser/10.7.5.650 Mobile”
}，
身体：""
};
if ($nobyda.isRequest) {
GetCookie（）
} else {
signTieBa（）
}


函数signTieBa() {
useParallel = $nobyda.read("BDTB_DailyBonus_Mode") || useParallel
singleNotifyCount = $nobyda.read("BDTB_DailyBonus_notify") || singleNotifyCount
如果（！cookieVal）{
$nobyda.notify("贴吧签到", "签到失败", "未获取到cookie");
返回$nobyda.done()
}
$nobyda.get(url_fetch_sign, function(error, response, data) {
如果（错误）{
$nobyda.notify("贴吧签到", "签到失败", "未获取到签到列表");
$nobyda.done（）
} else {
// $nobyda.notify("贴吧签到", "贴吧列表", response.body);
var body = JSON.parse（数据）；
var isSuccessResponse = body && body.no == 0 && body.error == "success" && body.data.tbs;
如果（！isSuccessResponse) {
$nobyda.notify("贴吧签到", "签到失败", (body && body.error) ?body.error：“接口数据获取失败”）；
返回$nobyda.done()
}
process.total = body.data.like_forum.length;
if (body.data.like_forum && body.data.like_forum.length > 0) {
if (useParallel == 1 || (useParallel == 0 && body.data.like_forum.length >= 30)) {
signBars（body.data.like_forum，body.data.tbs，0）；
} else {
for (const bar of body.data.like_forum) {
signBar（bar，body.data.tbs）；
}
}
} else {
$nobyda.notify("贴吧签到", "签到失败", "请确认你有关注的贴吧");
返回$nobyda.done()
}
}
}）
}

function signBar(bar, tbs) {
if (bar.is_sign == 1) { // 已签到的,直接不请求接口了
process.result.push（{
bar: `${bar.forum_name}``,
级别：bar.user_level，
exp：bar.user_exp，
错误代码：9999，
errorMsg：“已签到”
}）；
checkIsAllProcessed();
} else {
url_fetch_add.body = `tbs=${tbs}&kw=${bar.forum_name}&ie=utf-8`;
$nobyda.post(url_fetch_add, function(error, response, data) {
如果（错误）{
process.result.push（{
bar：bar.forum_name，
错误代码：999，
errorMsg：'接口错误'
}）；
checkIsAllProcessed();
} else {
尝试{
var addResult = JSON.parse（数据）；
if (addResult.no == 0) {
process.result.push（{
bar：bar.forum_name，
错误代码：0，
errorMsg: `获得${addResult.data.uinfo.cont_sign_num}积分，第${addResult.data.uinfo.user_sign_rank}个签到`
}）；
} else {
process.result.push（{
bar：bar.forum_name，
errorCode：addResult.no，
errorMsg：addResult.error
}）；
}
} catch (e) {
$nobyda.notify("贴吧签到", "贴吧签到数据处理异常", JSON.stringify(e));
$nobyda.done（）
}
checkIsAllProcessed();
}
}）
}
}

功能标志栏（bars，tbs，索引）{
//$nobyda.notify("贴吧签到", `进度${index}/${bars.length}`, "");
如果（索引>= bars.length）{
//$nobyda.notify("贴吧签到", "签到已满", `${process.result.length}`);
checkIsAllProcessed();
} else {
var bar = bars[index];
if (bar.is_sign == 1) { // 已签到的,直接不请求接口了
process.result.push（{
bar: `${bar.forum_name}``,
级别：bar.user_level，
exp：bar.user_exp，
错误代码：9999，
errorMsg：“已签到”
}）；
signBars（bars，tbs，++index）；
} else {
url_fetch_add.body = `tbs=${tbs}&kw=${bar.forum_name}&ie=utf-8`;
$nobyda.post(url_fetch_add, function(error, response, data) {
如果（错误）{
process.result.push（{
bar：bar.forum_name，
错误代码：999，
errorMsg：'接口错误'
}）；
signBars（bars，tbs，++index）；
} else {
尝试{
var addResult = JSON.parse（数据）；
if (addResult.no == 0) {
process.result.push（{
bar：bar.forum_name，
错误代码：0，
errorMsg: `获得${addResult.data.uinfo.cont_sign_num}积分，第${addResult.data.uinfo.user_sign_rank}个签到`
}）；
} else {
process.result.push（{
bar：bar.forum_name，
errorCode：addResult.no，
errorMsg：addResult.error
}）；
}
} catch (e) {
$nobyda.notify("贴吧签到", "贴吧签到数据处理异常", JSON.stringify(e));
$nobyda.done（）
}
signBars（bars，tbs，++index）
}
}）
}
}
}

函数checkIsAllProcessed() {
//$nobyda.notify("贴吧签到", `最终进度${process.result.length}/${process.total}`, "");
如果（process.result.length！= process.total）返回；
for (var i = 0; i < Math.ceil(process.total / singleNotifyCount); i++) {
var notify = "";
var spliceArr = process.result.splice(0, singleNotifyCount);
var notifySuccessCount = 0;
for (const res of spliceArr) {
if (res.errorCode == 0 || res.errorCode == 9999) {
通知成功计数++;
}
if (res.errorCode == 9999) {
通知+= `【${res.bar}】已签到，当前等级${res.level}，经验${res.exp}
`;
} else {
通知+= `【${res.bar}】${res.errorCode==0?'签到成功':'签到失败'}，${res.errorCode==0?res.errorMsg:('原因：'+res.errorMsg)}
`;
}
}
$nobyda.notify("贴吧签到", `签到${spliceArr.length}个,成功${notifySuccessCount}个`, notify);
$nobyda.done（）
}
}

函数 GetCookie() {
var headerCookie = $request.headers["Cookie"];
if (headerCookie) {
如果（$nobyda.read（“CookieTB”）！= undefined）{
如果（$nobyda.read（“CookieTB”）！= headerCookie）{
如果（headerCookie.indexOf（“BDUSS”）！= -1) {
var cookie = $nobyda.write（headerCookie，"CookieTB"）；
如果（！饼干）{
$nobyda.notify("更新贴吧Cookie失败!!️", "", "");
} else {
$nobyda.notify("更新贴吧Cookie成功🎉", "", "")
}
}
}
} else {
如果（headerCookie.indexOf（“BDUSS”）！= -1) {
var cookie = $nobyda.write（headerCookie，"CookieTB"）；
如果（！饼干）{
$nobyda.notify("首次写入贴吧Cookie失败!!️", "", "");
} else {
$nobyda.notify("首次写入贴吧Cookie成功🎉", "", "")
}
}
}
}
$nobyda.done（）
}

function nobyda() {
const isRequest = $request的类型！= "未定义"
const isSurge = $httpClient的类型！= "未定义"
const isQuanX = $task的类型！= "未定义"
const notify = (title, subtitle, message) => {
如果（isQuanX）$notify（标题，副标题，消息）
if (isSurge) $notification.post(title, subtitle, message)
}
const write = (value, key) => {
如果（isQuanX）返回$prefs.setValueForKey（值，键）
如果（isSurge）返回$persistentStore.write（值，键）
}
const read = (key) => {
如果（isQuanX）返回$prefs.valueForKey（key）
如果（isSurge）返回$persistentStore.read（密钥）
}
const adapterStatus = (response) => {
如果（回复）{
if (response.status) {
response["statusCode"] = response.status
} else if (response.statusCode) {
response["status"] = response.statusCode
}
}
退货回复
}
const get =（选项，回调）=> {
if (isQuanX) {
if (typeof options == "string") options = {
url：选项
}
options["method"] = "GET"
$task.fetch(options).then(response => {
回调（null，适配器状态（response），response.body）
}, reason => callback(reason.error, null, null))
}
if (isSurge) $httpClient.get(options, (error, response, body) => {
回调（错误，适配器状态（响应），正文）
}）
}
const post = (options, callback) => {
if (isQuanX) {
if (typeof options == "string") options = {
url：选项
}
options["method"] = "POST"
$task.fetch(options).then(response => {
回调（null，适配器状态（response），response.body）
}, reason => callback(reason.error, null, null))
}
if (isSurge) {
$httpClient.post(options, (error, response, body) => {
回调（错误，适配器状态（响应），正文）
}）
}
}
const done = (value = {}) => {
如果（isQuanX）返回$done（价值）
如果（isSurge）是请求？$done（价值）：$done（）
}
返回{
是请求，
通知，
写，
阅读，
得到，
帖子，
完成
}
};
