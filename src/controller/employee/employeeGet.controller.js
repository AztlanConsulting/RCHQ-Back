const employeeService = require("../../service/employee/employeeGet.service");
 

exports.getDocumentsByEmployee = async (req, res) => {
  try {
    const {id} = req.params;

    if(!id){
        console.error("Not Id provided");
        return res.status(400).json({
            success: false,
            message: "Bad Request",
        });
    }

    const result = await employeeService.getDocumentsByEmployee(id);
    return res.status(result.status).json(result.body);

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};