export default class AppError extends Error{
    constructor(message,Statuscode){
        super(message)
        this.Statuscode = Statuscode
        this.status = `${Statuscode}`.startsWith('4') ? 'fail' : 'error'
        
    }
}