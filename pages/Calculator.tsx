import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateFairPrice } from '../services/geminiService';
import { CropInput, PriceResult } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Calculator, AlertTriangle, CheckCircle, TrendingUp, IndianRupee, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CalculatorPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CropInput>({
    cropName: '',
    quantity: 0,
    unit: 'Quintal',
    quality: 'Medium',
    region: '',
    seedCost: 0,
    fertilizerCost: 0,
    labourCost: 0,
    maintenanceCost: 0,
    otherCost: 0,
    marketRate: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg(null);
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    
    try {
      const data = await calculateFairPrice(formData, language);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = Number(formData.seedCost || 0) + 
                    Number(formData.fertilizerCost || 0) + 
                    Number(formData.labourCost || 0) + 
                    Number(formData.maintenanceCost || 0) + 
                    Number(formData.otherCost || 0);

  const isRateLimit = errorMsg?.includes('RATE_LIMIT');
  const isKeyError = errorMsg?.includes('API Key');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-900 mb-8 flex items-center">
        <Calculator className="mr-3" /> {t('calc_title')}
      </h1>
      
      {errorMsg && (
        <div className={`mb-6 p-4 rounded-xl border-l-4 flex items-start shadow-sm animate-shake ${isRateLimit ? 'bg-orange-50 border-orange-500' : 'bg-red-50 border-red-500'}`}>
          {isRateLimit ? <RefreshCw className="text-orange-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" /> : <AlertCircle className="text-red-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />}
          <div>
            <p className={`font-bold ${isRateLimit ? 'text-orange-800' : 'text-red-800'}`}>
              {isRateLimit ? 'Server Busy (Rate Limit)' : 'Calculation Error'}
            </p>
            <p className={`text-sm mt-1 ${isRateLimit ? 'text-orange-700' : 'text-red-700'}`}>
              {errorMsg}
            </p>
            {isKeyError && (
              <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-xs font-bold text-red-900 hover:underline bg-red-100 px-2 py-1 rounded">
                <Key size={12} className="mr-1" /> Get a New API Key
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-green-100 h-fit">
          <form onSubmit={handleCalculate} className="space-y-4">
            <Input 
              label={t('calc_crop_name')}
              name="cropName"
              value={formData.cropName}
              onChange={handleChange}
              required
              placeholder="e.g. Wheat, Basmati Rice"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label={t('calc_quantity')}
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('calc_quality')}</label>
                <select 
                  name="quality" 
                  value={formData.quality}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>

            <Input 
              label={t('calc_region')}
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
              placeholder="e.g. Punjab, Bihar"
            />
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Cultivation Costs</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t('calc_cost_seeds')} name="seedCost" type="number" value={formData.seedCost} onChange={handleChange} required />
                  <Input label={t('calc_cost_fertilizer')} name="fertilizerCost" type="number" value={formData.fertilizerCost} onChange={handleChange} required />
                  <Input label={t('calc_cost_labour')} name="labourCost" type="number" value={formData.labourCost} onChange={handleChange} required />
                  <Input label={t('calc_cost_maint')} name="maintenanceCost" type="number" value={formData.maintenanceCost} onChange={handleChange} required />
                  <Input label={t('calc_cost_other')} name="otherCost" type="number" value={formData.otherCost} onChange={handleChange} required className="md:col-span-2" />
               </div>
               <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center text-green-800">
                  <span className="font-bold text-sm">{t('calc_total_cost_label')}:</span>
                  <span className="font-bold text-lg flex items-center"><IndianRupee size={16}/> {totalCost.toLocaleString()}</span>
               </div>
            </div>
            
            <Input 
              label={t('calc_market_rate')}
              name="marketRate"
              type="number"
              value={formData.marketRate}
              onChange={handleChange}
              required
              placeholder="What is the trader offering?"
            />

            <Button type="submit" fullWidth disabled={loading} className="mt-4 text-lg">
              {loading ? 'Analyzing with AI...' : t('calc_button')}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          {!result && !loading && (
            <div className="bg-green-50 p-8 rounded-xl border border-green-200 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <TrendingUp className="w-16 h-16 text-green-300 mb-4" />
              <p className="text-green-800 text-lg">Enter details to generate a fair price report.</p>
            </div>
          )}

          {loading && (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
               <p className="text-gray-600">Consulting global agricultural data...</p>
            </div>
          )}

          {result && (
            <>
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-green-500">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Fair Value Assessment</h2>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-green-700">₹{result.fairPrice.toLocaleString()}</span>
                  <span className="text-gray-500 mb-1">Total Fair Value</span>
                </div>
                
                <div className={`flex items-center p-3 rounded-lg ${result.marketComparison > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {result.marketComparison > 0 ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                  <span className="font-medium">
                    This price is {Math.abs(result.marketComparison)}% {result.marketComparison > 0 ? 'HIGHER' : 'LOWER'} than the market offer.
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Cost Breakdown</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Base Cost', value: result.breakdown.baseCost },
                        { name: 'Profit Margin', value: result.breakdown.profitMargin },
                        { name: 'Risk Premium', value: result.breakdown.riskPremium },
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        { [0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#9CA3AF', '#22C55E', '#EAB308'][index]} />
                          )) }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">AI Expert Analysis</h3>
                <p className="text-blue-800 text-sm leading-relaxed mb-4">{result.explanation}</p>
                <div className="bg-white bg-opacity-60 p-4 rounded-lg">
                  <strong className="block text-blue-900 mb-1">Recommendation:</strong>
                  <p className="text-blue-800 italic">{result.recommendation}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;