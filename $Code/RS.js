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
document.getElementById("closeWithdrawPopup").addEventListener("click", function () {
  document.getElementById("withdrawPopup").classList.add("hidden");
});


const options = [
  "₹50", "₹10", "₹100", "₹100", "₹40", "₹40 ", "₹49",
  "₹10", "₹49", "₹49", "₹49", "₹40", "₹-99", "51",
  "₹100", "₹1", "₹1000","₹10",
  "₹5", "₹69", "₹10"
];

const numOptions = options.length;
const arcSize = (2 * Math.PI) / numOptions;
let currentAngle = 0;
let isSpinning = false;
let spinVelocity = 0;

let spinCount = 0; // Track the number of spins

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

    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#fffb00";
    ctx.fill();
    ctx.strokeStyle = "#ff0000";
    ctx.stroke();

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(startAngle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000000";
    ctx.font = "20px Arial";
    ctx.fillText(options[i], canvas.width / 2 - 20, 10);
    ctx.restore();
  }

  drawArrow();
}

function drawArrow() {
  const arrowHeight = 20;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.beginPath();
  ctx.moveTo(-10, -canvas.height / 2);
  ctx.lineTo(10, -canvas.height / 2);
  ctx.lineTo(0, -canvas.height / 2 - arrowHeight);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
}

function spinWheel() {
  if (isSpinning) return;
  if (userBalance < 50) {
    alert("You don't have enough balance! Please add funds.");
    return;
  }

  userBalance -= 50;
  updateBalance();

  isSpinning = true;
  spinVelocity = Math.random() * 10 + 20;
  const deceleration = 0.97;

  spinSound.play();
  spinCount++; // Increment the spin count

  // Modify the options array to ensure ₹19, ₹29, ₹100 appear only after 15 or 17 spins
  const rareAmounts = ["100", "", "₹1000"];
  if (spinCount % 50 === 0 || spinCount % 50 === 0) {
    const rareAmount = rareAmounts[Math.floor(Math.random() * rareAmounts.length)];
    const index = Math.floor(Math.random() * numOptions);
    options[index] = rareAmount; // Replace one random option with a rare amount
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

spinButton.addEventListener("click", spinWheel);

withdrawButton.addEventListener("click", function () {
  document.getElementById("withdrawPopup").classList.remove("hidden");
});

document.getElementById("confirmWithdraw").addEventListener("click", function () {
  const withdrawAmount = parseInt(document.getElementById("withdrawAmount").value);
  
  // Check if the withdrawal amount is at least ₹1000
  if (withdrawAmount < 1000) {
    alert("The minimum withdrawal amount is ₹1000.");
    return;
  }
  
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

  if (!upiId || withdrawAmountInput <= 1000) {
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
    amount: 5000,
    currency: "INR",
    name: "Money Wheel ",
    description: "Add funds to your account",
    handler: function (response) {
      alert("Payment successful!");
      userBalance += 50;
      updateBalance();
      window.location.href = "https://novo0007.github.io/rszw/$Code/RS.html";
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
closePopup.addEventListener("click", function () {
  popup.classList.add("hidden");
});

loadHistory();
drawWheel();
updateBalance();
