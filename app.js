const $=x=>document.getElementById(x);

$("menu").onclick=()=>$("links").classList.toggle("open");

document.querySelectorAll(".choose").forEach(b=>b.onclick=()=>{
  $("plan").value=b.dataset.plan;
  $("order").scrollIntoView({behavior:"smooth"});
});

$("orderForm").onsubmit=async e=>{
  e.preventDefault();

  const p={
    name:$("name").value,
    email:$("email").value,
    tradingview_username:$("tv").value,
    plan:$("plan").value,
    payment_method:$("payment").value,
    transaction_id:$("trx").value,
    message:$("message").value
  };

  try{
    const r=await fetch("/api/orders",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(p)
    });

    const d=await r.json();

    if(!r.ok) throw Error(d.error || "API request failed");

    $("orderResult").innerHTML=
      `<div class="result">
        <b>Order submitted ✅</b><br>
        Order ID: <strong>${esc(d.order_id)}</strong><br>
        Status: ${esc(d.status || "Pending")}
      </div>`;

  }catch(err){
    $("orderResult").innerHTML=
      `<div class="result">
        <b>API Error ❌</b><br>
        ${esc(err.message)}
      </div>`;
  }
};

$("statusForm").onsubmit=async e=>{
  e.preventDefault();

  try{
    const r=await fetch(
      "/api/orders/"+encodeURIComponent($("lookup").value)
    );

    const d=await r.json();

    if(!r.ok) throw Error(d.error || "Order not found");

    $("statusResult").innerHTML=
      `<div class="result">
        <b>${esc(d.order_id)}</b><br>
        Plan: ${esc(d.plan)}<br>
        Status: <strong>${esc(d.status)}</strong>
      </div>`;

  }catch(err){
    $("statusResult").innerHTML=
      `<div class="result">
        <b>Error ❌</b><br>
        ${esc(err.message)}
      </div>`;
  }
};

function esc(v){
  return String(v).replace(
    /[&<>"']/g,
    c=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[c])
  );
}