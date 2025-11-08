import fetch from 'node-fetch';

async function testDepartmentAPI() {
    try {
        console.log('🔍 Testing /api/shared/departments endpoint...\n');

        // You'll need a valid JWT token for this to work
        // For testing, we can directly call the controller function instead
        
        // Import the controller directly
        const { getAllDepartments } = await import('./modules/shared/controllers/department.shared.controller.js');
        
        // Mock request and response objects
        const mockReq = {};
        const mockRes = {
            json: (data) => {
                console.log('✅ Response from getAllDepartments:');
                console.log(JSON.stringify(data, null, 2));
                
                console.log('\n📊 Summary:');
                data.forEach(dept => {
                    console.log(`\n📌 ${dept.departmentName} (ID: ${dept.id})`);
                    console.log(`   Employee Count: ${dept.employeeCount || 0}`);
                    console.log(`   Users Array Length: ${dept.users?.length || 0}`);
                    if (dept.users && dept.users.length > 0) {
                        console.log('   Users:');
                        dept.users.forEach(u => console.log(`     - ${u.fullName}`));
                    }
                });
                
                process.exit(0);
            },
            status: (code) => ({
                json: (data) => {
                    console.error('❌ Error Response:', code);
                    console.error(JSON.stringify(data, null, 2));
                    process.exit(1);
                }
            })
        };

        await getAllDepartments(mockReq, mockRes);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testDepartmentAPI();
