function durinput() {
  const durationInput = document.createElement("input");
  durationInput.setAttribute("type", "text");
  durationInput.setAttribute("id", "duration");
  durationInput.setAttribute("class", "rounded-full w-28 px-2 py-2 border border-gray-700 text-white bg-gray-800 placeholder-gray-400");
  durationInput.setAttribute("placeholder", "Attack Duration (e.g., 10s)");

  return durationInput;
}

function extractip() {
    const paragraphs = document.querySelectorAll('#otpt-cnt p');
    for (const paragraph of paragraphs) {
      if (paragraph.textContent.includes("ip:")) {
        const ipParts = paragraph.textContent.split(": ");
        if (ipParts.length === 2) {
          return ipParts[1];
        }
      }
    }
    return null;
  }


function sendcat(ipAddress, attackduration) {
  if (!ipAddress || !attackduration) {

    return;
  }

  fetch('/sendAttack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ipAddress, duration: attackduration }),
  })
    .then(response => {
      if (response.ok) {
        const successnoti = document.createElement("div");
        successnoti.setAttribute("id", "jews-a-notification");
        successnoti.setAttribute("class", "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative");
        successnoti.setAttribute("role", "alert");

        successnoti.innerHTML = `
          <strong class="font-bold">Success:</strong>
          <span class="block sm:inline">Attack Sent Successfully</span>
        `;


        successnoti.style.position = 'fixed';
        successnoti.style.top = '0';
        successnoti.style.right = '0';


        document.body.appendChild(successnoti);

        return response.json();
      } else {
        throw new Error(`Failed to send attack request: ${response.statusText}`);
      }
    })
    .then(data => {


    })
}

function cretbtnattack() {
  const container = document.createElement("div");
  container.setAttribute("class", "");

  const durationInput = durinput();

  const sendAttackBtn = document.createElement("button");
  sendAttackBtn.setAttribute("id", "send-attack");
  sendAttackBtn.setAttribute("class", "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded-full rounded-l-lg ml-2");
  sendAttackBtn.innerText = "Send Attack";

  sendAttackBtn.addEventListener("click", function () {
    const ipAddress = extractip();
    const attackduration = durationInput.value.trim();

    if (ipAddress) {
      if (attackduration) {
        sendcat(ipAddress, attackduration);
      } else {

        const errorjews = document.createElement("div");
        errorjews.setAttribute("id", "errorjew-notification");
        errorjews.setAttribute("class", "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative");
        errorjews.setAttribute("role", "alert");

        errorjews.innerHTML = `
          <strong class="font-bold">Error:</strong>
          <span class="block sm:inline">Duration is Empty</span>
        `;


        errorjews.style.position = 'fixed';
        errorjews.style.top = '0';
        errorjews.style.right = '0';


        document.body.appendChild(errorjews);
      }
    } else {

    }
  });

  container.appendChild(durationInput);
  container.appendChild(sendAttackBtn);

  return container;
}





document.addEventListener("DOMContentLoaded", async function () {
  const lkpBtn = document.getElementById("lkp-btn");
  const otptCnt = document.getElementById("otpt-cnt");

  otptCnt.innerText = "No Data To Display...";

lkpBtn.addEventListener("click", async function () {
  ('Search button clicked');


  const existingsuccessnoti = document.getElementById("success-notification");
  if (existingsuccessnoti) {
    existingsuccessnoti.remove();
  }

  const existingjewnoti = document.getElementById("errorjew-notification");
  if (existingjewnoti) {
    existingjewnoti.remove();
  }

  const existingErrorNoti = document.getElementById("error-notification");
  if (existingErrorNoti) {
    existingErrorNoti.remove();
  }

  const attacksentexist = document.getElementById("jews-a-notification");
  if (attacksentexist) {
    attacksentexist.remove();
  }

  

  const id = document.getElementById("ip-num").value.trim();
  const formData = new URLSearchParams();
  formData.append('discordId', id);

  try {
    const response = await fetch('/getData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (response.ok) {
      const respdata = await response.json();
      if (respdata.results && respdata.results.length > 0) {

        const successnoti = document.createElement("div");
        successnoti.setAttribute("id", "success-notification");
        successnoti.setAttribute("class", "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative");
        successnoti.setAttribute("role", "alert");

        successnoti.innerHTML = `
          <strong class="font-bold">Success:</strong>
          <span class="block sm:inline">Search was Successful</span>
        `;


        successnoti.style.position = 'fixed';
        successnoti.style.top = '0';
        successnoti.style.right = '0';


        document.body.appendChild(successnoti);


        const result = respdata.results[0];
        const resultHTML = htmlresult(id, result);

        otptCnt.innerHTML = resultHTML;


        const sendAttackBtn = cretbtnattack();
        otptCnt.appendChild(sendAttackBtn);
      } else {

        const nodatanoti = document.createElement("div");
        nodatanoti.setAttribute("id", "error-notification");
        nodatanoti.setAttribute("class", "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative");
        nodatanoti.setAttribute("role", "alert");

        nodatanoti.innerHTML = `
          <strong class="font-bold">Error:</strong>
          <span class="block sm:inline">No data found for the given ID</span>
        `;


        nodatanoti.style.position = 'fixed';
        nodatanoti.style.top = '0';
        nodatanoti.style.right = '0';


        document.body.appendChild(nodatanoti);


        otptCnt.innerHTML = "";
      }
    } else {

    }
  } catch (error) {

  }
});


  function htmlresult(id, result) {
    const resultHTML = Object.entries(result)
      .filter(([key]) => key !== 'ip_result')
      .map(([key, value]) => `<p class="text-white">${key}: ${value}</p>`)
      .join('');

    return `
      <div class="flex items-center">
        <div id="discord-id" class="mb-2">ID: ${id}</div>
      </div>
      ${resultHTML}
    `;
  }


});