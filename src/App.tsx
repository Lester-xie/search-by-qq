import React, {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import emptyIcon from './empty.gif'
import loadingIcon from './loading.gif'
import useDebounce from './hooks/useDebounce';

// 用户信息类型
interface UserInfo {
    qq: string,
    name: string,
    qlogo: string
}

// 请求返回类型
interface Response extends UserInfo {
    code: number,
    msg?: string
}

// 提取获取用户信息的请求方法
const fetchUser = async (QQ: string): Promise<Response> => {
    const res = await fetch(`https://api.uomg.com/api/qq.info?qq=${QQ}`);
    return await res.json()
}

// 自定义一个钩子函数来拆分业务，设置查询业务所需的状态和返回查询结果
const useUserInfo = () => {
    // 设置4个业务逻辑相关的变量
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [QQ, setQQ] = useState('');

    // QQ作为输入框的变量，为避免请求频繁，需要添加防抖
    const debouncedQQ = useDebounce(QQ, 300) as string

    useEffect(() => {
        // 输入框的值变化时对 states 初始化。放在条件判断外面，这样当输入框为空时就可以清除搜索结果
        setUserInfo(null);
        setError('');

        // 如果有值就进行搜索
        if (debouncedQQ.length > 0) {
            setLoading(true);
            fetchUser(debouncedQQ)
                .then((response) => {
                    // code 为 1 时表示有查询结果，否则把错误信息放到页面显示
                    if (response.code === 1) {
                        setUserInfo(response)
                    } else {
                        throw new Error(response.msg)
                    }
                })
                .catch((error) => {
                    setError(error.message);
                })
                .finally(() => {
                    setLoading(false);
                })
        }
    }, [debouncedQQ])

    return {setQQ, loading, userInfo, error}
}

export default function App() {
    // 定义输入框的元素引用
    const inputRef = useRef<HTMLInputElement | null>(null)
    const {setQQ, loading, userInfo, error} = useUserInfo()

    // 打开页面后自动聚焦输入框
    useEffect(() => {
        inputRef.current?.focus()
    }, [inputRef])

    // 渲染loading状态
    const renderLoading = useCallback(() => {
        if (loading) {
            return (
                <div className="loadingWrap">
                    <img src={loadingIcon} className="loading" alt="loading"/>
                </div>
            )
        }
    }, [loading])

    // 渲染错误状态
    const renderError = useCallback(() => {
        if (error) {
            return (
                <div>
                    <img src={emptyIcon} className="empty" alt="empty"/>
                    <p className="error">{error}</p>
                </div>
            )
        }
    }, [error])

    // 有搜索结果时，渲染用户信息
    const renderUserInfo = useCallback(() => {
        if (userInfo) {
            return (
                <div className="user-info-container">
                    <img className="avatar" src={userInfo.qlogo} alt="qlogo"/>
                    <div className="text-wrap">
                        <p>{userInfo.name}</p>
                        <p>{userInfo.qq}</p>
                    </div>
                </div>
            )
        }
    }, [userInfo])

    return (
        <div className="app">
            <main className="app-container">
                <form>
                    <h2>QQ号查询</h2>
                    <input ref={inputRef} type="number" placeholder="请输入QQ号" onChange={e => setQQ(e.target.value)}/>
                    <div className="result">
                        {renderLoading()}
                        {renderError()}
                        {renderUserInfo()}
                    </div>
                </form>
            </main>
        </div>
    );
}
