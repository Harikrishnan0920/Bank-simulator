const fs=require("fs") 
const crypto = require("crypto");

class Bank {
  constructor(name = "IBanks") {
    this.name = name;
    this.customers = {};
    this.accounts = {};
    this.loans = {};
    this.loanDetails = [];
  }

  addCustomer(customer) {
    this.customers[customer.id]= customer;
    return customer.id;
  }

  createAccount(customerId , type) {
    if ( !["checking", "savings"].includes(type) ) throw new Error("Enter a valid account type");
    const account = new Account({ customerId, type });
    this.accounts[account.id]= account;
    this.customers[customerId].accountIds.push(account.id);
    return account.id;
  }

  deposit(accountId,amount) {

    if(amount>0){
      const account = this.accounts[accountId];
      if (!account )  throw new Error("Account not found");
      account.balance+= amount;
      return {currentBalance : account.balance}
    }else{
       throw new Error("Enter valid amount"); 
    }  
  }

  withdraw(accountId , amount ) {
    let account = this.accounts[accountId]
    if (!account )  throw new Error("Account not found");
    if(amount <= account.balance){
    account.balance -= amount
    return {currentBalance : account.balance}}
    else { throw new Error("Not enough balance"); 
   }
  }

  applyForLoan({customerId , amount, tenure }) {
    const customer = this.customers[customerId];
    if (!customer) throw new Error("Customer not found");
    if ( amount <= 0) throw new Error("Enter valid loan amount");
    if ( tenure <= 0) throw new Error("Enter valid tenure (months)");

    const emi = Math.ceil(amount/tenure);
    const ratio = (customer.monthlyExpenses + emi) / customer.monthlyIncome;
    let loanResult=""
    if (ratio <= 0.36) {

      const loan = new Loan({ customerId, amount, tenure, emi });
      loanResult={ customerId, status: "approved", loanId: loan.id, emi, ratio }
      this.loans[loan.id] = loan;
      customer.loanIds.push(loan.id);
      this.loanDetails.push(loanResult);
      fs.appendFileSync("loanLogs.txt", JSON.stringify(loanResult) + "\n");
      return { status: "approved", loanId: loan.id ,emi ,tenure };
    } else {
      loanResult={ customerId, status: "rejected", reason: "high ratio", demographics:  customer.demographics }
      this.loanDetails.push(loanResult);
      fs.appendFileSync("loanLogs.txt", JSON.stringify(loanResult) + "\n");
      return { status: "rejected" , reason: loanResult.reason};
    }
  }

  payLoan(loanId , amount) {
    const loan = this.loans[loanId];
    if (!loan )  throw new Error("Loan not found");
    if (amount <= 0) throw new Error("Enter valid amount");
    if(loan.outstanding<amount) throw new Error("Payment exceeds outstanding");
    loan.outstanding-= amount;
    loan.paid+= amount; 
    if (loan.outstanding <=0){
        loan.status ="closed";
    } 
    return loan;
  }

  getAccountSummary() {
    let Checking=0;
    let Savings=0;
    
    Object.values(this.accounts).forEach((e)=>{
    e.type=="savings"?Savings++:Checking++
    });

    return { "Savings accounts count":Savings, "Checking accounts count":Checking};
  }

  bestLoans() {
    const all = Object.values(this.loans);
    all.sort((a, b) => b.paid / b.amount - a.paid / a.amount);
    return all.slice(0,2);
  }

  rejectedDemographics() {
    return this.loanDetails.filter((e) => e.status === "rejected").map((e) => e.demographics);
  }
}

class Customer {
  constructor({ name, monthlyIncome = 0 , monthlyExpenses = 0 , demographics = {} }) {
    this.id = "cus_" + crypto.randomUUID()
    this.name = name;
    this.monthlyIncome = monthlyIncome;
    this.monthlyExpenses = monthlyExpenses;
    this.demographics = demographics;
    this.accountIds = [];
    this.loanIds = [];
  }
}

class Account {
  constructor({ customerId, type }) {
    this.id = "ac_" +  crypto.randomUUID()
    this.customerId = customerId;
    this.type = type;
    this.balance = 0;
  }
}

class Loan {
  constructor({ customerId , amount , tenure , emi }) {
    this.id = "loan_" +  crypto.randomUUID()
    this.status = "approved";
    this.customerId = customerId;
    this.amount = amount;
    this.tenureMonths = tenure;
    this.emi = emi;
    this.outstanding = amount;
    this.paid = 0;
  }
}




//----------->
function demo(){

const bank = new Bank();

const customer1 = new Customer({ name: "Hari", monthlyIncome: 50000, monthlyExpenses: 10000, demographics: { age: 24, city: "Chennai" } });
const customer2 = new Customer({ name: "niraj", monthlyIncome: 20000, monthlyExpenses: 15000, demographics: { age: 27, city: "Jaipur" } });
const customer3 = new Customer({ name: "ilavarasan", monthlyIncome: 67000, monthlyExpenses: 5000, demographics: { age: 27, city: "Mumbai" } });
const customer4 = new Customer({ name: "vikram", monthlyIncome: 80000, monthlyExpenses: 10000, demographics: { age: 27, city: "Kochi" } });



let c1=bank.addCustomer(customer1);
let c2=bank.addCustomer(customer2);
let c3=bank.addCustomer(customer3);
let c4=bank.addCustomer(customer4);



console.log("Added customers::--> ",[c1,c2,c3,c4])

const account1 = bank.createAccount(customer1.id, "checking");
const account2 = bank.createAccount(customer2.id, "savings");
const account3 = bank.createAccount(customer3.id, "checking");
const account4 = bank.createAccount(customer4.id, "checking");

console.log("Created accounts::--> ",[account1,account2,account3,account4])




let acct1deposit=bank.deposit(account1, 50000);
let acct1withdraw=bank.withdraw(account1,20000);

console.log("account1Transactions::",acct1deposit,acct1withdraw)

let acct3deposit=bank.deposit(account3, 5000); 
 

console.log("account3Transactions::",acct3deposit)



const loan1 = bank.applyForLoan({customerId:customer1.id , amount: 100000, tenure: 24 });
const loan2 = bank.applyForLoan({customerId:customer2.id , amount: 10000, tenure: 12 });
const loan3 = bank.applyForLoan({customerId:customer3.id , amount: 10000, tenure: 24 });
const loan4 = bank.applyForLoan({customerId:customer4.id , amount: 10000, tenure: 24 });

console.log("Applied for loan::",[loan1,loan2,loan3,loan4])
 
if(loan1.status=="approved") bank.payLoan(loan1.loanId, 50000);
if(loan2.status=="approved") bank.payLoan(loan2.loanId, 50000);
if(loan3.status=="approved")bank.payLoan(loan3.loanId, 6000);
if(loan4.status=="approved")bank.payLoan(loan4.loanId, 10000);
 
 
  
console.log("Account summary:", bank.getAccountSummary());
console.log("Top loans:", bank.bestLoans());
console.log("Rejected demographics:", bank.rejectedDemographics());

}
demo()