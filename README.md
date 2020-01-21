It is a NODEJS Application

The App is deployed to heroku and can be accessed in https://priyars-task-manager.herokuapp.com/

Please add the below code under Tests section of your postman request and set the authentication of your request folder as Bearer Token with variable {{authToken}}

if(pm.response.code === 201){
pm.environment.set('authToken', pm.response.json().token)
}

To authenticate your requests set the authorization as 'Inherit auth from parent'.

The above code will fetch the created token for your user and set its value to the authToken variable.
