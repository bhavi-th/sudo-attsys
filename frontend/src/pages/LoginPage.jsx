import Form from '../components/Form';

const LoginPage = ({ type }) => {
    return (
        <div className="LoginPage">
            <Form formType="Log In" type={type} />
        </div>
    );
};

export default LoginPage;
