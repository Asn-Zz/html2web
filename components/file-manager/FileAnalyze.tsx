import { useEffect, useState } from "react"
import { Database, ChartSpline, ArrowDownToLine } from "lucide-react"

interface AnalyzeData {
    BillingItemCodeName: string,
    BucketName: string,
    DosageBeginTime: string,
    DosageEndTime: string,
    DosageValue: string,
    SubProductCodeName: string,
    Unit: 'GB' | '万次请求'
}

export function FileAnalyze() {
    const [data, setData] = useState<{ mb: number; requests: number; size: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const getAnalyzeData = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/cos-analyze")
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`)
            }
            const data = await res.json()
            const { totalMB, totalRequests, storeSizeValue } = data.DetailSets.reduce(
                (acc: { totalMB: number; totalRequests: number; storeSizeValue: number }, item: AnalyzeData) => {
                    if (item.SubProductCodeName.includes('流量')) {
                        acc.totalMB += Number(item.DosageValue) * 1024;
                    }
                    if (item.Unit === '万次请求') {
                        acc.totalRequests += Number(item.DosageValue) * 10000;
                    }
                    if (item.BillingItemCodeName.includes('容量')) {
                        acc.storeSizeValue = Number(item.DosageValue) * 1024;
                    }
                    return acc;
                },
                { totalMB: 0, totalRequests: 0, storeSizeValue: 0 }
            );            

            setData({
                mb: parseFloat(totalMB.toFixed(2)),
                requests: Math.round(totalRequests),
                size: parseFloat(storeSizeValue.toFixed(2))
            })
            setLoading(false)
        } catch (error) {
            setError(`获取数据失败: ${error instanceof Error ? error.message : "未知错误"}`)
            setLoading(false)
        }
    }

    let loaded = false
    useEffect(() => {
        if (loaded) return
        getAnalyzeData()
        loaded = true
    }, [])

    if (loading) {
        return <p className="text-sm text-gray-500">统计(本月)：加载中...</p>
    }

    if (error) {
        return <p className="text-sm text-red-500">统计(本月)：{error}</p>
    }

    if (!data) {
        return <p className="text-sm text-gray-500">统计(本月)：无数据</p>
    }

    return (
        <div className="text-sm text-gray-500 flex items-center gap-2">
            <Database size={14} />{data.size.toLocaleString()} MB
            <ChartSpline size={14} />{data.mb.toLocaleString()} MB
            <ArrowDownToLine size={14} />{data.requests.toLocaleString()} 次
        </div>
    )
}