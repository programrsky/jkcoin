import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import styles from '../../../css/ExChangePage/Mid/ExChangePageMid.module.css';
import { ReactComponent as SearchIcon } from '../../../svg/ExChangePage/Mid/search-icon.svg';
import { Link, useNavigate } from 'react-router-dom';

const ExChangePageMid = () => {
    const [exchangeRate, setExchangeRate] = useState(null);
    const [cryptoData, setCryptoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('KRW'); // 현재 활성화된 탭 상태
    const [priceChanges, setPriceChanges] = useState({}); // 가격 변경 이력
    const navigate = useNavigate();
    if (!localStorage.getItem('user_key')) {
        navigate("/LoginPage");
    }
    const cryptoSymbols = useMemo(
        () => [
            'bitcoin',
            'solana',
            'ethereum',
            'stacks',
            'aelf',
            'dogecoin',
            'status',
            'tether',
            'litecoin',
            'cardano',
            'chainlink',
            'vechain',
            'stellar',
            'cosmos',
            'tron',
            'polkadot',
            'uniswap',
            'aave',
            'algorand',
            'avalanche',
            'monero',
            'tezos',
            'nem',
            'dash',
            'iota',
            'zcash',
            'decred',
            'qtum',
            'waves',
            'maker',
            'compound',
            'yearn-finance',
            'balancer',
            'curve-dao-token',
            'ren',
            'loopring',
            'zilliqa',
            'holo',
            'theta',
            'enjin-coin',
            'bancor',
            'ocean-protocol',
            'serum',
            'sushiswap',
            '1inch',
            'pancakeswap',
            'bakerytoken',
        ],
        []
    );

    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
                setExchangeRate(response.data.rates.KRW);
            } catch (err) {
                setError(err.message);
            }
        };

        const fetchCryptoData = async () => {
            const requests = cryptoSymbols.map((symbol) =>
                axios
                    .get(`https://api.coincap.io/v2/assets/${symbol}`)
                    .then((response) => response.data.data)
                    .catch((error) => {
                        console.error(`Error fetching data for ${symbol}:`, error.message);
                        return null;
                    })
            );

            try {
                const responses = await Promise.all(requests);
                const filteredData = responses.filter((data) => data !== null);
                const updatedPriceChanges = { ...priceChanges };

                filteredData.forEach((crypto) => {
                    const priceUsd = parseFloat(crypto.priceUsd);
                    const prevPrice = priceChanges[crypto.id] ? priceChanges[crypto.id].price : priceUsd;
                    const changeType =
                        priceUsd > prevPrice
                            ? 'up'
                            : priceUsd < prevPrice
                            ? 'down'
                            : priceChanges[crypto.id]?.type || '';

                    updatedPriceChanges[crypto.id] = { price: priceUsd, type: changeType };
                });

                // 원래 순서 유지
                const sortedData = cryptoSymbols.map((symbol) => filteredData.find((crypto) => crypto?.id === symbol));

                setPriceChanges(updatedPriceChanges);
                setCryptoData(sortedData);
                setLoading(false);
            } catch (err) {
                console.error('Error while fetching crypto data:', err.message);
                return [];
            }
        };

        const fetchData = async () => {
            await fetchExchangeRate();
            await fetchCryptoData();
        };

        fetchData();

        const intervalId = setInterval(() => {
            fetchData();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [cryptoSymbols, priceChanges]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p>오류: {error}</p>;

    return (
        <div className={styles.content}>
            <div className={styles.searchBar}>
                <SearchIcon className={styles.searchIcon} />
                <input type="text" placeholder="코인명/심볼 검색" />
            </div>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'KRW' ? styles.active : ''}`}
                    onClick={() => handleTabClick('KRW')}
                >
                    KRW
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'USDT' ? styles.active : ''}`}
                    onClick={() => handleTabClick('USDT')}
                >
                    USDT
                </button>
                <button
                    className={`${styles.tab} ${activeTab === '관심' ? styles.active : ''}`}
                    onClick={() => handleTabClick('관심')}
                >
                    관심
                </button>
            </div>
            <div className={styles.exchangeTableContainer}>
                <table className={styles.exchangeTable}>
                    <thead>
                        <tr>
                            <th>코인 이름/코드</th>
                            <th>가격 ({activeTab === 'KRW' ? 'KRW' : 'USD'})</th>
                            <th>전일대비 (24H %)</th>
                            <th>거래 대금 ({activeTab === 'KRW' ? '백만 원' : 'USD'})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cryptoData.map((coin, index) => {
                            if (!coin) return null;
                            const currentPrice = parseFloat(coin.priceUsd);
                            const changeType = priceChanges[coin.id]?.type || '';
                            const priceClass =
                                changeType === 'up' ? styles.priceUp : changeType === 'down' ? styles.priceDown : '';

                            return (
                                <tr key={index}>
                                    <td>
                                        <Link to={`/buycoins?coinName=${encodeURIComponent(coin.id)}`}>
                                            {coin.name} ({coin.symbol})
                                        </Link>
                                    </td>
                                    <td className={priceClass}>
                                        {activeTab === 'KRW'
                                            ? `${(currentPrice * exchangeRate).toFixed(3)} KRW`
                                            : `$${currentPrice.toFixed(3)}`}
                                    </td>
                                    <td
                                        className={
                                            parseFloat(coin.changePercent24Hr) > 0 ? styles.changeUp : styles.changeDown
                                        }
                                    >
                                        {parseFloat(coin.changePercent24Hr).toFixed(2)}%
                                    </td>
                                    <td>
                                        {activeTab === 'KRW'
                                            ? `${((parseFloat(coin.volumeUsd24Hr) * exchangeRate) / 100000000).toFixed(
                                                  2
                                              )}백만`
                                            : `$${(parseFloat(coin.volumeUsd24Hr) / 100000).toFixed(2)}`}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExChangePageMid;
