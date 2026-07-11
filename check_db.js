const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://rahulkush5225:Rahul52us@cluster0.uku04rj.mongodb.net/dental')
.then(()=>mongoose.connection.db.collection('workdones').find({'paymentHistory': {$exists: true}}).sort({_id:-1}).limit(1).toArray())
.then(res=>{console.log(JSON.stringify(res,null,2)); process.exit(0)});
