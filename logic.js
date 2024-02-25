

const signin = document.getElementById("signin");
const createAccount = document.getElementById("createAcc");
let dataReady = false;
signin.addEventListener("click", function(){

    //console.log("click occured from the independent file");

    if(1==='1'){

        //
        console.log(document.getElementById("user").textContent);
        alert("please enter all the required filds");

    }
    else{

        //create an xml object
        var req = new XMLHttpRequest();
        
        let url = "https://jsonplaceholder.typicode.com/users";

        url.onreadystatechange = function () {
            console.log(req.state);

            if( req.readyState ==4 && req.status == 200){

            var results = req.responseText;
            console.log(results);
            dataReady = true;
            alert(req);


            }

};


        req.open("GET", url, true);
        req.send();




    }


});

createAccount.addEventListener("click", function(){


});


function validate(text){
    if(text.length < 8 ){
        return false;
    }



}


