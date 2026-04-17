import Form from '../components/Form';

const SignUp = ({ type }) => {
    return (
        <div className="SignUp">
            <Form formType="Sign Up" type={type} />
        </div>
    );
};

export default SignUp;
