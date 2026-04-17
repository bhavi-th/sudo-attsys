import '../styles/teacher/Table.css';

const Table = ({ data }) => {
    if (!data || data.length === 0) {
        return <></>;
    }

    return (
        <div className="table-container">
            <table className="dynamic-table">
                <thead>
                    <tr>
                        {Object.keys(data[0]).map((key) => (
                            <th key={key}>{key}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr
                            key={i}
                            style={{
                                color: row.Status !== 'Present' ? 'red' : 'inherit',
                            }}
                        >
                            {Object.values(row).map((val, j) => (
                                <td
                                    key={j}
                                    className={
                                        j === 0
                                            ? 'sno'
                                            : j === 1
                                              ? 'name'
                                              : j === 2
                                                ? 'usn'
                                                : 'status'
                                    }
                                >
                                    {val}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
