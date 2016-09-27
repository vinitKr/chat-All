

exports.slash = function(req, res){
	res.render('index');
}

// exports.save = function(req, res){
// 	console.log(req.body);
// 	userData = {
// 		Name: req.body.name,
// 		Email: req.body.email,
// 		Password: req.body.password
// 	}
// 	dBConfig.chatDetailCollection.save(userData, function(err, result){
// 		if(!err){
// 			res.json({
// 				key: true
// 			})
// 		}
// 	})
// }

// exports.login = function(req,res){
// 	dBConfig.db.query("FOR doc IN chatDetailCollection FILTER doc.Email == @email AND doc.Password == @password RETURN doc", {
// 		'email': req.body.email,
// 		'password': req.body.password
// 	}, function(err, result){
// 		if(result._result.length > 0){
// 			res.json({
// 				name: result._result[0].Name,
// 				key: result._result[0]._key,
// 				socket_id: result._result[0].socket_id,
// 				authentication: true
// 			})
// 		} else {
// 			res.json({
// 				authentication: false,
// 				message: 'Your creditials is Wrong'
// 			})
// 		}
// 	})
// }

