// ==UserScript==
// @name         BiliBli动态批量举报
// @namespace    https://github.com/ayyayyayy2002/BlibiliDynamicBatchReport
// @version      0.0.1
// @description  以“涉政谣言”理由举报评论区的前二十个评论
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @author       You
// @match        https://space.bilibili.com/*/dynamic
// @icon         https://i2.hdslb.com/bfs/app/8920e6741fc2808cce5b81bc27abdbda291655d3.png@240w_240h_1c_1s_!web-avatar-space-header.avif
// @grant        GM.xmlHttpRequest

// @downloadURL https://update.greasyfork.org/scripts/506056/BiliBli%E5%8A%A8%E6%80%81%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5.user.js
// @updateURL https://update.greasyfork.org/scripts/506056/BiliBli%E5%8A%A8%E6%80%81%E6%89%B9%E9%87%8F%E4%B8%BE%E6%8A%A5.meta.js
// ==/UserScript==

// 创建用于显示诊断信息的窗口
const floatingWindow = document.createElement('div');
floatingWindow.style.position = 'fixed';
floatingWindow.style.top = '90px';
floatingWindow.style.right = '20px';
floatingWindow.style.zIndex = '9999';
floatingWindow.style.background = 'white';
floatingWindow.style.border = '1px solid #ccc';
floatingWindow.style.padding = '10px';
floatingWindow.style.maxWidth = '250px';
floatingWindow.style.overflow = 'auto'; // Add overflow property for scrolling
floatingWindow.style.height = '200px'; // Set a height for the window
floatingWindow.style.scrollBehavior = 'smooth'; // Enable smooth scrolling
document.body.appendChild(floatingWindow);
// Create diagnostic info container
const diagnosticInfo = document.createElement('div');
floatingWindow.appendChild(diagnosticInfo);
// Function to scroll to the bottom of the floating window
function scrollToBottom() {
  floatingWindow.scrollTop = floatingWindow.scrollHeight;
  // Scroll the last element into view
  const lastElement = floatingWindow.lastElementChild;
  if (lastElement) {
    lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
// Updating the diagnosticInfo.innerHTML with the scroll to bottom
function updateDiagnosticInfo(content) {
  diagnosticInfo.innerHTML += content;
  scrollToBottom();
}

function addButton() {
  // Existing button creation code remains unchanged
  // Add a call to sendReportRequest before calling the existing functionality
  const button = document.createElement('button');
  button.textContent = '自动举报所有动态';
  button.style.position = 'fixed';
  button.style.top = '60px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.onclick = function() {
    reportAllDynamic();
  };
  document.body.appendChild(button);
}




function getUid() {
        // 获取当前URL
        const url = window.location.href;
        // 使用正则表达式提取UID
        const match = url.match(/space\.bilibili\.com\/(\d+)\/dynamic/);
        return match ? match[1] : null; // 返回UID或null
    }


function getAllDynamic() {
    const uid = getUid();
    updateDiagnosticInfo('提取的UID:', uid);
    updateDiagnosticInfo("getAllDynamic function called\n");

    // 返回一个 Promise 对象
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "GET",
            url: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?host_mid=${uid}`,
            headers: {
                'Cookie': document.cookie
            },
            onload: function (response) {
                try {
                    // 解析 JSON 响应
                    var jsonResponse = JSON.parse(response.responseText);

                    // 提取所有的 id_str
                    let idStrArray = [];

                    if (jsonResponse && jsonResponse.data && jsonResponse.data.items) {
                        // 假设 id_str 在 items 的某个嵌套结构中
                        jsonResponse.data.items.forEach(item => {
                            if (item && item.id_str) {
                                idStrArray.push(item.id_str);
                            }
                        });
                    }

                    // 打印所有的 id_str 到控制台
                    console.log('提取的 id_str:', idStrArray);

                    resolve(idStrArray); // 使用 resolve 将结果传递出去
                } catch (error) {
                    console.error('解析响应失败:', error);
                    reject(error);
                }
            },
            onerror: function (error) {
                console.error('请求失败:', error);
                reject(error);
            }
        });
    });
}



// 在 reportAllComment 函数中，使用 async/await 来处理异步操作
async function reportAllDynamic() {
    const uid = getUid();
    try {
        const dyids = await getAllDynamic(); // 使用 await 来等待 getAllDynamic 的 Promise 结果
        let index = 0;
        const interval = 2500;

        function sendReportRequest() {
            if (index < dyids.length) { // 修改此处，使用 dyids
                reportDynamic(uid, dyids[index]); // 修改此处，使用 dyids
                index++;
                setTimeout(sendReportRequest, interval);
            }
        }

        // 调用sendReportRequest函数
        sendReportRequest();
    } catch (error) {
        updateDiagnosticInfo("Error occurred while getting dyids:", error + '\n'); // 修改错误提示
    }
}








let csrfText = '';
function getCsrf() {
    if (csrfText === '') {
        const cook = document.cookie.match(/bili_jct=(.*?);/) ?? [];
        if (cook.length === 2) {
            csrfText = cook[1];
        }
    }
    return csrfText;
}
function reportDynamic(uid, dyid) {
    const csrf = getCsrf();
    //const url = `https://api.bilibili.com/x/v2/reply/report?type=1&oid=${oid}&rpid=${rpid}&reason=1&content=&add_blacklist=false&ordering=heat&gaia_source=main_web&csrf=${csrf}`;
    const url = `https://api.bilibili.com/x/v2/reply/report?accused_uid=${uid}&dynamic_id=${dyid}&reason_type=9&reason_desc=null&csrf=${csrf}`;


    GM.xmlHttpRequest({
        method: "POST",
        url: url,
        headers: {
            'Cookie': document.cookie // Pass the cookies from the page to the request
        },
        responseType: "text",
        onload: function(response) {
            updateDiagnosticInfo(response.responseText+'\n');
        }
    });
}









window.onload = function() {
    addButton();



    };

