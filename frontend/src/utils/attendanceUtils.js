// Shared utility functions for student attendance management

export const updateAttendance = () => {
    try {
        let student = JSON.parse(localStorage.getItem('studentData'));
        
        if (!student) {
            console.error('No student data found in localStorage');
            return false;
        }
        
        // Increase attendance by 2, cap at 100
        student.attendance = Math.min(100, student.attendance + 2);
        
        // Save back to localStorage
        localStorage.setItem('studentData', JSON.stringify(student));
        
        // Dispatch custom event to notify components of data change
        window.dispatchEvent(new CustomEvent('studentDataUpdated', { 
            detail: { student } 
        }));
        
        return true;
    } catch (error) {
        console.error('Failed to update attendance:', error);
        return false;
    }
};

export const getStudentData = () => {
    try {
        const studentData = localStorage.getItem('studentData');
        return studentData ? JSON.parse(studentData) : null;
    } catch (error) {
        console.error('Failed to get student data:', error);
        return null;
    }
};

export const clearStudentData = () => {
    try {
        localStorage.removeItem('studentData');
        return true;
    } catch (error) {
        console.error('Failed to clear student data:', error);
        return false;
    }
};
