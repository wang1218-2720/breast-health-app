const Home = () => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-pink-600 mb-4">首页</h1>
      <div className="bg-pink-100 rounded-xl p-6 shadow-lg">
        <p className="text-pink-800 text-lg">✅ 实时修改测试</p>
        <p className="text-gray-600 mt-2">
          如果你能看到这个粉色背景的卡片，说明 Tailwind 生效了！
        </p>
        <p className="text-gray-500 text-sm mt-4">
          当前时间：{new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}

export default Home