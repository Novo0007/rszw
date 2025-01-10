const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const resultDiv = document.getElementById("result");
const balanceDiv = document.getElementById("balance");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");
const closePopup = document.getElementById("closePopup");
const addFundsButton = document.getElementById("addFundsButton");
const withdrawButton = document.getElementById("withdrawButton");
const spinSound = document.getElementById("spinSound");
const congratsSound = document.getElementById("congratsSound");
const historyDiv = document.getElementById("history");

let userBalance = JSON.parse(localStorage.getItem("userBalance")) || 0;

const options = [
  "₹1", "₹3", "₹5", "₹7", "₹6", "Bad luck 😢 ", "₹10",
  "₹-20", "₹3", "₹5", "₹7", "₹6", "₹9", "₹10",
  "₹19", "₹29", "₹100","₹-84",
  "Better luck next time", "+1 Spin", "₹-10"
];

const numOptions = options.length;
const arcSize = (2 * Math.PI) / numOptions;
let currentAngle = 0;
let isSpinning = false;
let spinVelocity = 0;

let spinCount = 0;  // Track the number of spins

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("spinHistory")) || [];
  historyDiv.innerHTML = "<h2>Spin History</h2>";
  history.forEach(entry => {
    const div = document.createElement("div");
    div.textContent = `You won: ${entry}`;
    historyDiv.appendChild(div);
  });
}

function updateBalance() {
  balanceDiv.textContent = `Your Balance: ₹${userBalance}`;
  localStorage.setItem("userBalance", JSON.stringify(userBalance));
}

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numOptions; i++) {
    const startAngle = currentAngle + i * arcSize;
    const endAngle = startAngle + arcSize;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, startAngle, endAngle, false);
    ctx.closePath();

    ctx.fillStyle = i % 2 === 0 ? "#ff5e57" : "#ffd700";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(startAngle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.fillText(options[i], canvas.width / 2 - 20, 10);
    ctx.restore();
  }

  drawArrow();
}

function drawArrow() {
  const arrowHeight = 20;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(currentAngle);
  ctx.beginPath();
  ctx.moveTo(0 - 10, -canvas.height / 2);
  ctx.lineTo(0 + 10, -canvas.height / 2);
  ctx.lineTo(0, -canvas.height / 2 - arrowHeight);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

function spinWheel() {
  if (isSpinning) return;
  if (userBalance < 10) {
    alert("You don't have enough balance! Please add funds.");
    return;
  }

  userBalance -= 10;
  updateBalance();

  isSpinning = true;
  spinVelocity = Math.random() * 10 + 20;
  let deceleration = 0.97;

  spinSound.play();

  spinCount++;  // Increment the spin count

  // Modify the options array to ensure ₹19, ₹29, ₹100 appear only after 15 or 17 spins
  const rareAmounts = ["₹19", "₹29", "₹100"];
  if (spinCount % 15 === 0 || spinCount % 15 === 0) {
    const rareAmount = rareAmounts[Math.floor(Math.random() * rareAmounts.length)];
    const index = Math.floor(Math.random() * numOptions);
    options[index] = rareAmount;  // Replace one random option with a rare amount
  }

  const spin = setInterval(() => {
    spinVelocity *= deceleration;
    currentAngle += spinVelocity * Math.PI / 180;

    drawWheel();

    if (spinVelocity < 0.1) {
      clearInterval(spin);
      isSpinning = false;
      spinSound.pause();
      spinSound.currentTime = 0;

      const selectedIndex = Math.floor((numOptions - (currentAngle % (2 * Math.PI)) / arcSize) % numOptions);
      const result = options[selectedIndex];

      popupMessage.textContent = `You won: ${result}`;
      congratsSound.play();
      popup.classList.remove("hidden");

      const history = JSON.parse(localStorage.getItem("spinHistory")) || [];
      history.push(result);
      localStorage.setItem("spinHistory", JSON.stringify(history));

      loadHistory();

      if (result.includes("₹")) {
        const amount = parseInt(result.replace("₹", ""), 10);
        userBalance += amount;
        updateBalance();
      }
    }
  }, 16);
}

withdrawButton.addEventListener("click", function () {
  document.getElementById("withdrawPopup").classList.remove("hidden");
});

document.getElementById("closeWithdrawPopup").addEventListener("click", function () {
  document.getElementById("withdrawPopup").classList.add("hidden");
});

document.getElementById("confirmWithdraw").addEventListener("click", function () {
  const withdrawAmount = parseInt(document.getElementById("withdrawAmount").value);
  if (withdrawAmount > userBalance) {
    alert("Insufficient balance.");
    return;
  }
  userBalance -= withdrawAmount;
  updateBalance();
  alert(`You have successfully withdrawn ₹${withdrawAmount}.`);
  document.getElementById("withdrawPopup").classList.add("hidden");

  const history = JSON.parse(localStorage.getItem("withdrawHistory")) || [];
  history.push(`₹${withdrawAmount}`);
  localStorage.setItem("withdrawHistory", JSON.stringify(history));
  loadWithdrawalHistory();
});

document.getElementById("submitWithdraw").addEventListener("click", function () {
  const upiId = document.getElementById("upiId").value;
  const withdrawAmountInput = parseInt(document.getElementById("withdrawAmountInput").value);

  if (!upiId || withdrawAmountInput <= 0) {
    alert("Please enter valid UPI ID and amount.");
    return;
  }

  alert(`Withdrawal request for ₹${withdrawAmountInput} has been submitted to ${upiId}.`);
  document.getElementById("withdrawPopup").classList.add("hidden");
});

function loadWithdrawalHistory() {
  const withdrawHistory = JSON.parse(localStorage.getItem("withdrawHistory")) || [];
  const withdrawHistoryDiv = document.getElementById("withdrawHistory");
  withdrawHistoryDiv.innerHTML = "<h2>Withdrawal History</h2>";
  withdrawHistory.forEach(entry => {
    const div = document.createElement("div");
    div.textContent = entry;
    withdrawHistoryDiv.appendChild(div);
  });
}

function initiatePayment() {
  const options = {
    key: "rzp_live_X4DZnSdUxCtfV8",
    amount: 1000,
    currency: "INR",
    name: "Zappy",
    description: "Add funds to your account",
    handler: function (response) {
      alert("Payment successful!");
      userBalance += 10;
      updateBalance();
      window.location.href = "/$Code/RS.html";
    },
    prefill: {
      name: "Zappyuser",
      email: "helpzappy@gmail.com",
      contact: "8016487441"
    },
    theme: {
      color: "#F37254"
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

addFundsButton.addEventListener("click", initiatePayment);

loadHistory();
drawWheel();
updateBalance();
