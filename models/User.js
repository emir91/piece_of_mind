const bcrypt = require("bcryptjs");
const userCollection = require('../db').db().collection("users");
const validator = require("validator");
const md5 = require("md5");

let User = function(data, getAvatar){
    this.data = data;
    this.errors = [];
    if(getAvatar == undefined){
        getAvatar == false
    }
    if(getAvatar){
        this.getAvatar();
    }
}

User.prototype.cleanUp = function(){
    if(typeof(this.data.username) != "string"){this.data.username = ""}
    if(typeof(this.data.email) != "string"){this.data.email = ""}
    if(typeof(this.data.password) != "string"){this.data.password = ""}

    // prevent sending additional properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => {
        if(this.data.username == ""){this.errors.push("You must provide a username.")}
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("Username can only contain letters and numbers.")}
        if(!validator.isEmail(this.data.email)){this.errors.push("You must provide valid email address.")}
        if(this.data.password == ""){this.errors.push("You must provide a password.")}
        if(this.data.password.length > 0 && this.data.password.length < 12){this.errors.push("Password must be at least 12 characters long.")}
        if(this.data.password.length > 50){this.errors.push("Password cannot exceed 50 characters.")}
        if(this.data.username.length > 0 && this.data.username < 3){this.errors.push("Username must be at least 3 characters long.")}
        if(this.data.username.length > 30){this.errors.push("Username cannot exceed 30 characters.")}
    
        // Only if username is valid then check to see if it's already taken
        if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
            let usernameExists = await userCollection.findOne({username: this.data.username})
            if(usernameExists){this.errors.push("Username is already taken.")}
        }
    
         // Only if email is valid then check to see if it's already taken
         if(validator.isEmail(this.data.email)){
            let emailExists = await userCollection.findOne({email: this.data.email})
            if(emailExists){this.errors.push("Email is already taken.")}
        }
        resolve()
    })
}

User.prototype.login = function(){
    return new Promise((resolve, reject) => {
        this.cleanUp();
        userCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                this.data = attemptedUser;
                this.getAvatar();
                resolve("Congrats")
            }else{
                reject("Invalid username/password")
            }
        }).catch(function(){
            reject("Please try again.")
        })
    })
}

User.prototype.register = function(){
    return new Promise(async (resolve, reject) => {
        // Step #1: Validate user data
        this.cleanUp();
        await this.validate();
        // Step #2: Only if there are no validation errors
       // then save user to db
        if(!this.errors.length){
            // hash user password
            let salt = bcrypt.genSaltSync(10);
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            // saving user to db
            await userCollection.insertOne(this.data);
            this.getAvatar();
            resolve();
        }else{
            reject(this.errors)
        }
        
    })
}

User.prototype.getAvatar = function(){
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

module.exports = User;