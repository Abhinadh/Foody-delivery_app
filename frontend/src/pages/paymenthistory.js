import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Table, Container, Row, Col, Card, Badge, Spinner, Form, InputGroup, Pagination } from 'react-bootstrap';

const PaymentHistoryPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        setLoading(true);
        axios.get(`http://localhost:5000/api/auth/paymentsfetch`)
            .then(res => {
                setPayments(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching payments:", err);
                setError("Failed to load payment history. Please try again later.");
                setLoading(false);
            });
    }, []);

    // Function to sort payments
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Perform sorting
    const sortedPayments = [...payments].sort((a, b) => {
        if (sortConfig.key === null) return 0;
        
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    // Filter payments based on search term and status
    const filteredPayments = sortedPayments.filter(payment => {
        const matchesSearch = 
            (payment.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'All' || payment.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Function to render status badge with appropriate color
    const renderStatusBadge = (status) => {
        let variant = 'secondary';
        
        switch(status) {
            case 'Success':
                variant = 'success';
                break;
            case 'Pending':
                variant = 'warning';
                break;
            case 'Failed':
                variant = 'danger';
                break;
            default:
                variant = 'secondary';
        }
        
        return <Badge bg={variant}>{status}</Badge>;
    };

    // Function to format date nicely
    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Get current payments for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Generate sort icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    return (
        <Container fluid className="py-4 bg-light" style={{ minHeight: '100vh' }}>
            <Row className="justify-content-center">
                <Col xs={12} lg={11}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Payment History</h4>
                            <div className="d-flex">
                                <Form.Select 
                                    className="me-2" 
                                    style={{ width: 'auto' }}
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Success">Success</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Failed">Failed</option>
                                </Form.Select>
                                <InputGroup style={{ width: '250px' }}>
                                    <Form.Control
                                        placeholder="Search payments..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                    <InputGroup.Text>
                                        <i className="bi bi-search"></i>
                                    </InputGroup.Text>
                                </InputGroup>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-3">Loading payment records...</p>
                                </div>
                            ) : error ? (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            ) : filteredPayments.length === 0 ? (
                                <div className="alert alert-info" role="alert">
                                    No payment records found.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover bordered className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="text-center">#</th>
                                                <th onClick={() => requestSort('buyerName')} style={{ cursor: 'pointer' }}>
                                                    Buyer {getSortIcon('buyerName')}
                                                </th>
                                                <th onClick={() => requestSort('restaurantName')} style={{ cursor: 'pointer' }}>
                                                    Restaurant Name {getSortIcon('restaurantName')}
                                                </th>
                                                <th> Restaurant Email</th>
                                                <th onClick={() => requestSort('amount')} style={{ cursor: 'pointer' }} className="text-end">
                                                    Amount {getSortIcon('amount')}
                                                </th>
                                                <th>Transaction ID</th>
                                                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }} className="text-center">
                                                    Status {getSortIcon('status')}
                                                </th>
                                                <th onClick={() => requestSort('createdAt')} style={{ cursor: 'pointer' }}>
                                                    Date {getSortIcon('createdAt')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPayments.map((payment, index) => (
                                                <tr key={payment._id || index}>
                                                    <td className="text-center">{indexOfFirstItem + index + 1}</td>
                                                    <td>{payment.buyerName}</td>
                                                    <td>{payment.restaurantName}</td>
                                                    <td>{payment.restaurantEmail}</td>
                                                    <td className="text-end fw-semibold">₹{payment.amount.toFixed(2)}</td>
                                                    <td>
                                                        <code className="bg-light px-2 py-1 rounded">{payment.transactionId}</code>
                                                    </td>
                                                    <td className="text-center">
                                                        {renderStatusBadge(payment.status)}
                                                    </td>
                                                    <td>{formatDate(payment.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                        <Card.Footer className="d-flex justify-content-between align-items-center bg-white border-top">
                            <div>
                                <Form.Select 
                                    size="sm" 
                                    style={{ width: 'auto' }}
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={5}>5 per page</option>
                                    <option value={10}>10 per page</option>
                                    <option value={20}>20 per page</option>
                                    <option value={50}>50 per page</option>
                                </Form.Select>
                            </div>
                            <div className="d-flex align-items-center">
                                <small className="text-muted me-3">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} entries
                                </small>
                                <Pagination size="sm" className="mb-0">
                                    <Pagination.First 
                                        disabled={currentPage === 1} 
                                        onClick={() => paginate(1)}
                                    />
                                    <Pagination.Prev 
                                        disabled={currentPage === 1} 
                                        onClick={() => paginate(currentPage - 1)}
                                    />
                                    
                                    {Array.from({ length: Math.min(5, Math.ceil(filteredPayments.length / itemsPerPage)) }, (_, i) => {
                                        const pageNum = currentPage > 3 && Math.ceil(filteredPayments.length / itemsPerPage) > 5 ? 
                                            currentPage - 3 + i + (currentPage + 2 > Math.ceil(filteredPayments.length / itemsPerPage) ? 
                                            Math.ceil(filteredPayments.length / itemsPerPage) - currentPage - 2 : 0) : i + 1;
                                            
                                        if (pageNum <= Math.ceil(filteredPayments.length / itemsPerPage)) {
                                            return (
                                                <Pagination.Item 
                                                    key={pageNum} 
                                                    active={pageNum === currentPage}
                                                    onClick={() => paginate(pageNum)}
                                                >
                                                    {pageNum}
                                                </Pagination.Item>
                                            );
                                        }
                                        return null;
                                    })}
                                    
                                    <Pagination.Next 
                                        disabled={currentPage === Math.ceil(filteredPayments.length / itemsPerPage)} 
                                        onClick={() => paginate(currentPage + 1)}
                                    />
                                    <Pagination.Last 
                                        disabled={currentPage === Math.ceil(filteredPayments.length / itemsPerPage)} 
                                        onClick={() => paginate(Math.ceil(filteredPayments.length / itemsPerPage))}
                                    />
                                </Pagination>
                            </div>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default PaymentHistoryPage;